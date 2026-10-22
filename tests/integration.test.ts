import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, media, providers, users } from "@/db/schema";
import { authenticate, deleteAccount, registerUser } from "@/server/users";
import { createSessionRecord, validateSessionToken, deleteAllSessionsForUser } from "@/server/sessions";
import { addMedia, getArtistProfile, listArtists, toggleFollow, updateArtistProfile, artistStats, recordProfileView } from "@/server/artists";
import { addBookingMessage, changeBookingStatus, createBooking, getBookingDetail, listBookingsForActor } from "@/server/bookings";
import { applyToOpportunity, createReport } from "@/server/catalog";
import { adminAddFeature, adminResolveReport, adminSetUserStatus, adminUpsertService, adminListUsers, adminUpsertOpportunity } from "@/server/admin";
import { AppError } from "@/server/errors";
import { genre, makePublishedArtist, makeUser } from "./helpers";

const future = () => new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
const bookingInput = () => ({ eventType: "discoteca" as const, eventDate: future(), location: "Santo Domingo", details: "Noche de dembow, set de 60 minutos." });
const code = async (p: Promise<unknown>) => {
  try {
    await p;
    return "ok";
  } catch (e) {
    return e instanceof AppError ? e.code : String(e);
  }
};

describe("cuentas y sesiones", () => {
  it("registra, impide correos duplicados y nunca guarda la contraseña en claro", async () => {
    const u = await registerUser({ name: "Ana", email: "ana-dup@test.local", password: "Contraseña123", role: "fan" });
    const [row] = await db.select().from(users).where(eq(users.id, u.id));
    expect(row!.passwordHash.startsWith("scrypt$")).toBe(true);
    expect(row!.passwordHash).not.toContain("Contraseña123");
    expect(await code(registerUser({ name: "Ana", email: "ANA-DUP@test.local", password: "Contraseña123", role: "fan" }))).toBe("conflict");
  });

  it("un artista recibe un perfil en borrador, no publicado", async () => {
    const u = await makeUser("artist");
    const [a] = await db.select().from(artists).where(eq(artists.userId, u.id));
    expect(a!.isPublished).toBe(false);
  });

  it("autentica y rechaza credenciales inválidas o cuentas suspendidas", async () => {
    const u = await makeUser("fan");
    expect((await authenticate(u.email, "Contraseña123")).id).toBe(u.id);
    expect(await code(authenticate(u.email, "incorrecta1"))).toBe("invalid");
    expect(await code(authenticate("nadie@test.local", "Contraseña123"))).toBe("invalid");
    const admin = await makeUser("admin");
    await adminSetUserStatus(admin, u.id, "suspended");
    expect(await code(authenticate(u.email, "Contraseña123"))).toBe("forbidden");
  });

  it("sesiones: el token valida, se invalida al cerrar y al suspender", async () => {
    const u = await makeUser("fan");
    const { token } = await createSessionRecord(u.id);
    expect((await validateSessionToken(token))?.id).toBe(u.id);
    expect(await validateSessionToken("token-falso")).toBeNull();
    await deleteAllSessionsForUser(u.id);
    expect(await validateSessionToken(token)).toBeNull();
    const { token: t2 } = await createSessionRecord(u.id);
    const admin = await makeUser("admin");
    await adminSetUserStatus(admin, u.id, "suspended");
    expect(await validateSessionToken(t2)).toBeNull();
  });
});

describe("perfiles de artista", () => {
  it("un artista no puede editar el perfil de otro", async () => {
    const { artist } = await makePublishedArtist();
    const intruder = await makeUser("artist");
    const g = await genre();
    const data = { stageName: "Hackeado", genreId: g.id, shortBio: "xxxxxxxxxxxx", bio: "", bookingEnabled: true, isPublished: true };
    expect(await code(updateArtistProfile(intruder, artist.id, data))).toBe("forbidden");
    const fan = await makeUser("fan");
    expect(await code(updateArtistProfile(fan, artist.id, data))).toBe("forbidden");
  });

  it("los perfiles no publicados no aparecen en el catálogo ni son visibles para terceros", async () => {
    const owner = await makeUser("artist");
    const [a] = await db.select().from(artists).where(eq(artists.userId, owner.id));
    const { items } = await listArtists({ limit: 60 });
    expect(items.find((i) => i.id === a!.id)).toBeUndefined();
    expect(await getArtistProfile(a!.slug, null)).toBeNull();
    expect(await getArtistProfile(a!.slug, owner)).not.toBeNull();
  });

  it("seguir / dejar de seguir y estadísticas reales de la plataforma", async () => {
    const { user, artist } = await makePublishedArtist();
    const fan = await makeUser("fan");
    expect(await toggleFollow(fan, artist.id)).toBe(true);
    await recordProfileView(artist.id);
    await recordProfileView(artist.id);
    let s = await artistStats(user, artist.id);
    expect(s.followers).toBe(1);
    expect(s.views30).toBe(2);
    expect(await toggleFollow(fan, artist.id)).toBe(false);
    s = await artistStats(user, artist.id);
    expect(s.followers).toBe(0);
    expect(await code(artistStats(fan, artist.id))).toBe("forbidden");
  });

  it("el contenido exige confirmación de derechos y lo no oficial queda en revisión", async () => {
    const { user, artist } = await makePublishedArtist();
    expect(await code(addMedia(user, artist.id, { title: "x", platform: "youtube", url: "https://youtu.be/abcdefghijk", rightsConfirmed: false }))).toBe("invalid");
    expect(await addMedia(user, artist.id, { title: "Otro", platform: "other", url: "https://example.com/v", rightsConfirmed: true })).toBe("under_review");
    const p = await getArtistProfile(artist.slug, null);
    expect(p!.media).toHaveLength(0);
  });
});

describe("flujo de contratación", () => {
  it("ciclo completo con permisos por parte", async () => {
    const { user: artistUser, artist } = await makePublishedArtist();
    const promoter = await makeUser("promoter");
    const stranger = await makeUser("promoter");

    const b = await createBooking(promoter, artist.id, bookingInput());
    expect(b.status).toBe("pending");

    // Terceros no pueden ver ni modificar
    expect(await code(getBookingDetail(stranger, b.id))).toBe("not_found");
    expect(await code(changeBookingStatus(stranger, b.id, "cancelled"))).toBe("not_found");

    // El correo del solicitante no se comparte mientras está pendiente
    expect((await getBookingDetail(artistUser, b.id)).requester.email).toBeNull();

    // El solicitante no puede aceptar su propia solicitud
    expect(await code(changeBookingStatus(promoter, b.id, "accepted"))).toBe("forbidden");

    await changeBookingStatus(artistUser, b.id, "negotiating", "Hablemos de horarios");
    const detail = await getBookingDetail(artistUser, b.id);
    expect(detail.requester.email).toBe(promoter.email);
    await addBookingMessage(promoter, b.id, "Perfecto, de 10 a 11 pm");
    await changeBookingStatus(artistUser, b.id, "accepted");
    expect((await getBookingDetail(promoter, b.id)).booking.status).toBe("accepted");

    // Estados finales: no se reabre
    await changeBookingStatus(promoter, b.id, "cancelled");
    expect(await code(changeBookingStatus(artistUser, b.id, "accepted"))).toBe("forbidden");
    expect(await code(addBookingMessage(promoter, b.id, "hola"))).toBe("invalid");

    const received = await listBookingsForActor(artistUser, "received");
    expect(received.map((r) => r.id)).toContain(b.id);
    expect(await code(listBookingsForActor(promoter, "all"))).toBe("forbidden");
  });

  it("no se puede contratar a artistas sin contratación activa ni a uno mismo", async () => {
    const { user, artist } = await makePublishedArtist();
    expect(await code(createBooking(user, artist.id, bookingInput()))).toBe("forbidden");
    await db.update(artists).set({ bookingEnabled: false }).where(eq(artists.id, artist.id));
    const promoter = await makeUser("promoter");
    expect(await code(createBooking(promoter, artist.id, bookingInput()))).toBe("forbidden");
  });

  it("limita solicitudes abiertas repetidas", async () => {
    const { artist } = await makePublishedArtist();
    const promoter = await makeUser("promoter");
    for (let i = 0; i < 3; i++) await createBooking(promoter, artist.id, bookingInput());
    expect(await code(createBooking(promoter, artist.id, bookingInput()))).toBe("rate_limited");
  });
});

describe("administración y moderación", () => {
  it("las funciones de administración rechazan a usuarios sin rol admin", async () => {
    const fan = await makeUser("fan");
    expect(await code(adminListUsers(fan))).toBe("forbidden");
    const artist = await makeUser("artist");
    expect(await code(adminSetUserStatus(artist, fan.id, "suspended"))).toBe("forbidden");
  });

  it("un servicio activo exige proveedor asignado y activo", async () => {
    const admin = await makeUser("admin");
    const base = { title: "Mezcla " + Date.now(), category: "Producción", summary: "Resumen del servicio", description: "Descripción del servicio", deliverables: [], priceFrom: null, currency: "DOP", priceIsDemo: true, icon: "sliders", sortOrder: 0 };
    expect(await code(adminUpsertService(admin, null, { ...base, status: "active", providerId: null }))).toBe("invalid");
    const [p] = await db.insert(providers).values({ name: "Proveedor inactivo", isActive: false }).returning();
    expect(await code(adminUpsertService(admin, null, { ...base, status: "active", providerId: p!.id }))).toBe("invalid");
    expect(await code(adminUpsertService(admin, null, { ...base, status: "coming_soon", providerId: null }))).toBe("ok");
  });

  it("los destacados patrocinados requieren patrocinador y solo artistas publicados", async () => {
    const admin = await makeUser("admin");
    const { artist } = await makePublishedArtist();
    expect(await code(adminAddFeature(admin, { artistId: artist.id, placement: "home_destacados", kind: "patrocinado", reason: "Campaña de prueba" }))).toBe("invalid");
    const hidden = await makeUser("artist");
    const [h] = await db.select().from(artists).where(eq(artists.userId, hidden.id));
    expect(await code(adminAddFeature(admin, { artistId: h!.id, placement: "home_destacados", kind: "editorial", reason: "Selección editorial" }))).toBe("invalid");
  });

  it("denuncia por derechos de autor con retirada del contenido", async () => {
    const { user, artist } = await makePublishedArtist();
    await addMedia(user, artist.id, { title: "Video", platform: "youtube", url: "https://youtu.be/abcdefghijk", rightsConfirmed: true });
    const [m] = await db.select().from(media).where(eq(media.artistId, artist.id));
    const reportId = await createReport(null, {
      targetType: "media",
      targetId: m!.id,
      reason: "derechos_autor",
      details: "Este video usa mi canción sin autorización.",
      reporterName: "Titular",
      reporterEmail: "titular@test.local",
      isRightsHolder: true,
    });
    const admin = await makeUser("admin");
    await adminResolveReport(admin, reportId, "actioned", "Retirado por infracción", true);
    const [after] = await db.select().from(media).where(eq(media.id, m!.id));
    expect(after!.status).toBe("removed");
    expect((await getArtistProfile(artist.slug, null))!.media).toHaveLength(0);
  });

  it("solo artistas con perfil publicado pueden postularse, una sola vez", async () => {
    const admin = await makeUser("admin");
    await adminUpsertOpportunity(admin, null, { title: "Showcase test", type: "showcase", organizer: "Org", summary: "Resumen", description: "Descripción", rules: "", location: null, deadline: future(), isSponsored: false, sponsorName: null, status: "published" });
    const { opportunities } = await import("@/db/schema");
    const [o] = await db.select().from(opportunities).where(eq(opportunities.title, "Showcase test"));
    const fan = await makeUser("fan");
    expect(await code(applyToOpportunity(fan, o!.id, "Quiero participar en este showcase"))).toBe("forbidden");
    const { user } = await makePublishedArtist();
    await applyToOpportunity(user, o!.id, "Quiero participar en este showcase");
    expect(await code(applyToOpportunity(user, o!.id, "Otra vez"))).toBe("conflict");
  });
});

describe("privacidad", () => {
  it("eliminar la cuenta anonimiza datos y retira el perfil", async () => {
    const { user, artist } = await makePublishedArtist();
    const { token } = await createSessionRecord(user.id);
    await deleteAccount(user);
    const [u] = await db.select().from(users).where(eq(users.id, user.id));
    expect(u!.email).not.toBe(user.email);
    expect(u!.name).toBe("Usuario eliminado");
    expect(u!.status).toBe("deleted");
    const [a] = await db.select().from(artists).where(eq(artists.id, artist.id));
    expect(a!.isPublished).toBe(false);
    expect(a!.userId).toBeNull();
    expect(await validateSessionToken(token)).toBeNull();
    expect(await code(authenticate(user.email, "Contraseña123"))).toBe("invalid");
  });
});
