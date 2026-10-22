import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, genres, users, type Role } from "@/db/schema";
import { registerUser } from "@/server/users";
import type { Actor } from "@/lib/auth/policies";

export async function genre() {
  const slug = `g-${randomUUID().slice(0, 8)}`;
  const [g] = await db.insert(genres).values({ slug, name: slug }).returning();
  return g!;
}

export async function makeUser(role: Exclude<Role, "admin"> | "admin" = "fan"): Promise<Actor & { email: string }> {
  const email = `${randomUUID().slice(0, 8)}@test.local`;
  const selfRole = role === "admin" ? "fan" : role;
  const u = await registerUser({ name: `Test ${role}`, email, password: "Contraseña123", role: selfRole });
  if (role === "admin") await db.update(users).set({ role: "admin" }).where(eq(users.id, u.id));
  return { id: u.id, role, status: "active", email };
}

/** Crea un artista con perfil publicado y listo para recibir solicitudes. */
export async function makePublishedArtist() {
  const user = await makeUser("artist");
  const g = await genre();
  const [a] = await db
    .update(artists)
    .set({ isPublished: true, genreId: g.id, shortBio: "Descripción de prueba" })
    .where(eq(artists.userId, user.id))
    .returning();
  return { user, artist: a! };
}
