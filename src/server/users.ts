import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, follows, users, sessions } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { isActive, selfServiceRoles, type Actor } from "@/lib/auth/policies";
import { slugify } from "@/lib/utils";
import { AppError, forbidden, invalid } from "./errors";
import { audit } from "./audit";

export async function uniqueArtistSlug(base: string) {
  const root = slugify(base) || "artista";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const [hit] = await db.select({ id: artists.id }).from(artists).where(eq(artists.slug, candidate)).limit(1);
    if (!hit) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function registerUser(input: { name: string; email: string; password: string; role: (typeof selfServiceRoles)[number] }) {
  if (!selfServiceRoles.includes(input.role)) throw forbidden("Tipo de cuenta no permitido");
  const email = input.email.toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw new AppError("conflict", "Ya existe una cuenta con este correo");
  const passwordHash = await hashPassword(input.password);
  return db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ name: input.name, email, passwordHash, role: input.role }).returning();
    if (input.role === "artist") {
      // Perfil en borrador: no es público hasta que el artista lo complete y lo publique.
      await tx.insert(artists).values({ userId: user!.id, slug: await uniqueArtistSlug(input.name), stageName: input.name, isPublished: false });
    }
    return user!;
  });
}

const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function authenticate(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  // Siempre se calcula un hash para no revelar si el correo existe por diferencia de tiempos
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw invalid("Correo o contraseña incorrectos");
  if (user.status === "suspended") throw forbidden("Tu cuenta está suspendida. Contacta con soporte.");
  if (user.status !== "active") throw invalid("Correo o contraseña incorrectos");
  return user;
}

export async function updateAccount(actor: Actor, data: { name: string; marketingOptIn: boolean }) {
  if (!isActive(actor)) throw forbidden();
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, actor.id));
}

export async function changePassword(actor: Actor, current: string, next: string) {
  if (!isActive(actor)) throw forbidden();
  const [u] = await db.select().from(users).where(eq(users.id, actor.id));
  if (!u || !(await verifyPassword(current, u.passwordHash))) throw invalid("La contraseña actual no es correcta");
  await db.update(users).set({ passwordHash: await hashPassword(next), updatedAt: new Date() }).where(eq(users.id, actor.id));
  await db.delete(sessions).where(eq(sessions.userId, actor.id));
}

/**
 * Eliminación de cuenta: se anonimizan los datos personales, se retira el perfil
 * artístico y su contenido deja de ser público. Las solicitudes de contratación se
 * conservan anonimizadas para que la otra parte mantenga su historial.
 */
export async function deleteAccount(actor: Actor) {
  if (!isActive(actor)) throw forbidden();
  if (actor.role === "admin") throw forbidden("Un administrador no puede eliminar su propia cuenta desde aquí");
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        email: `eliminado+${actor.id}@invalid.local`,
        name: "Usuario eliminado",
        passwordHash: "deleted",
        status: "deleted",
        marketingOptIn: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, actor.id));
    await tx.update(artists).set({ isPublished: false, bookingEnabled: false, userId: null, updatedAt: new Date() }).where(eq(artists.userId, actor.id));
    await tx.delete(follows).where(eq(follows.userId, actor.id));
    await tx.delete(sessions).where(eq(sessions.userId, actor.id));
  });
  await audit(actor.id, "account.deleted", "user", actor.id);
}

export async function exportAccountData(actor: Actor) {
  if (!isActive(actor)) throw forbidden();
  const [u] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, marketingOptIn: users.marketingOptIn, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, actor.id));
  const artist = await db.select().from(artists).where(eq(artists.userId, actor.id));
  const followed = await db.select({ artistId: follows.artistId, since: follows.createdAt }).from(follows).where(eq(follows.userId, actor.id));
  return { user: u, artistProfile: artist[0] ?? null, follows: followed };
}
