import "server-only";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  artists,
  auditLog,
  bookingRequests,
  events,
  features,
  genres,
  leads,
  media,
  opportunities,
  opportunityApplications,
  posts,
  providers,
  releases,
  reports,
  serviceInquiries,
  services,
  sessions,
  users,
  verificationRequests,
  type Role,
} from "@/db/schema";
import { isAdmin, type Actor } from "@/lib/auth/policies";
import { slugify } from "@/lib/utils";
import { forbidden, invalid, notFound } from "./errors";
import { audit } from "./audit";

function assertAdmin(actor: Actor | null): asserts actor is Actor {
  if (!isAdmin(actor)) throw forbidden("Acceso restringido a administradores");
}

async function uniqueSlug(table: typeof services | typeof opportunities | typeof events | typeof posts, base: string, excludeId?: string) {
  const root = slugify(base) || "item";
  for (let i = 0; i < 50; i++) {
    const s = i ? `${root}-${i + 1}` : root;
    const [hit] = await db.select({ id: table.id }).from(table).where(eq(table.slug, s));
    if (!hit || hit.id === excludeId) return s;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/* -------------------------------- Métricas -------------------------------- */

export async function adminMetrics(actor: Actor) {
  assertAdmin(actor);
  const count = async (q: Promise<Array<{ n: number }>>) => (await q)[0]?.n ?? 0;
  const n = sql<number>`count(*)::int`;
  const [usersN, artistsN, publishedN, bookingsN, openReports, pendingVerif, newInquiries, newLeads] = await Promise.all([
    count(db.select({ n }).from(users).where(sql`${users.status} <> 'deleted'`)),
    count(db.select({ n }).from(artists)),
    count(db.select({ n }).from(artists).where(eq(artists.isPublished, true))),
    count(db.select({ n }).from(bookingRequests)),
    count(db.select({ n }).from(reports).where(or(eq(reports.status, "open"), eq(reports.status, "reviewing")))),
    count(db.select({ n }).from(verificationRequests).where(eq(verificationRequests.status, "pending"))),
    count(db.select({ n }).from(serviceInquiries).where(eq(serviceInquiries.status, "new"))),
    count(db.select({ n }).from(leads).where(eq(leads.status, "new"))),
  ]);
  const byRole = await db.select({ role: users.role, n }).from(users).where(sql`${users.status} <> 'deleted'`).groupBy(users.role);
  const byStatus = await db.select({ status: bookingRequests.status, n }).from(bookingRequests).groupBy(bookingRequests.status);
  return { usersN, artistsN, publishedN, bookingsN, openReports, pendingVerif, newInquiries, newLeads, byRole, byStatus };
}

export async function recentAudit(actor: Actor, limit = 15) {
  assertAdmin(actor);
  return db
    .select({ log: auditLog, actorName: users.name })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}

/* --------------------------------- Usuarios -------------------------------- */

export async function adminListUsers(actor: Actor, q?: string) {
  assertAdmin(actor);
  const term = q ? `%${q.replace(/[%_\\]/g, "")}%` : undefined;
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, isDemo: users.isDemo, createdAt: users.createdAt })
    .from(users)
    .where(term ? or(ilike(users.name, term), ilike(users.email, term)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(200);
}

export async function adminSetUserRole(actor: Actor, userId: string, role: Role) {
  assertAdmin(actor);
  if (userId === actor.id) throw invalid("No puedes cambiar tu propio rol");
  const [u] = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
  if (!u) throw notFound();
  await audit(actor.id, "user.role", "user", userId, { role });
}

export async function adminSetUserStatus(actor: Actor, userId: string, status: "active" | "suspended") {
  assertAdmin(actor);
  if (userId === actor.id) throw invalid("No puedes suspender tu propia cuenta");
  const [u] = await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
  if (!u) throw notFound();
  if (status === "suspended") await db.delete(sessions).where(eq(sessions.userId, userId));
  await audit(actor.id, `user.${status}`, "user", userId);
}

/* --------------------------------- Artistas -------------------------------- */

export async function adminListArtists(actor: Actor, q?: string) {
  assertAdmin(actor);
  const term = q ? `%${q.replace(/[%_\\]/g, "")}%` : undefined;
  return db
    .select({ a: artists, genreName: genres.name, ownerEmail: users.email })
    .from(artists)
    .leftJoin(genres, eq(genres.id, artists.genreId))
    .leftJoin(users, eq(users.id, artists.userId))
    .where(term ? ilike(artists.stageName, term) : undefined)
    .orderBy(desc(artists.createdAt))
    .limit(300);
}

export async function adminSetArtistPublished(actor: Actor, artistId: string, isPublished: boolean) {
  assertAdmin(actor);
  await db.update(artists).set({ isPublished, updatedAt: new Date() }).where(eq(artists.id, artistId));
  await audit(actor.id, isPublished ? "artist.publish" : "artist.unpublish", "artist", artistId);
}

export async function adminListVerifications(actor: Actor) {
  assertAdmin(actor);
  return db
    .select({ v: verificationRequests, stageName: artists.stageName, slug: artists.slug })
    .from(verificationRequests)
    .innerJoin(artists, eq(artists.id, verificationRequests.artistId))
    .orderBy(sql`case when ${verificationRequests.status} = 'pending' then 0 else 1 end`, desc(verificationRequests.createdAt))
    .limit(100);
}

export async function adminReviewVerification(actor: Actor, requestId: string, decision: "verified" | "rejected", note?: string) {
  assertAdmin(actor);
  const [v] = await db.select().from(verificationRequests).where(eq(verificationRequests.id, requestId));
  if (!v) throw notFound();
  if (v.status !== "pending") throw invalid("Esta solicitud ya fue revisada");
  await db.transaction(async (tx) => {
    await tx
      .update(verificationRequests)
      .set({ status: decision, reviewerNote: note ?? null, reviewedBy: actor.id, updatedAt: new Date() })
      .where(eq(verificationRequests.id, requestId));
    await tx.update(artists).set({ verification: decision, updatedAt: new Date() }).where(eq(artists.id, v.artistId));
  });
  await audit(actor.id, `verification.${decision}`, "artist", v.artistId);
}

/* --------------------------- Servicios y proveedores ----------------------- */

export async function adminListProviders(actor: Actor) {
  assertAdmin(actor);
  return db.select().from(providers).orderBy(providers.name);
}

export async function adminUpsertProvider(actor: Actor, id: string | null, data: Omit<typeof providers.$inferInsert, "id">) {
  assertAdmin(actor);
  if (id) await db.update(providers).set({ ...data, updatedAt: new Date() }).where(eq(providers.id, id));
  else await db.insert(providers).values(data);
  await audit(actor.id, id ? "provider.update" : "provider.create", "provider", id ?? undefined, { name: data.name });
}

export async function adminGetService(actor: Actor, id: string) {
  assertAdmin(actor);
  const [s] = await db.select().from(services).where(eq(services.id, id));
  return s ?? null;
}

export async function adminUpsertService(actor: Actor, id: string | null, data: Omit<typeof services.$inferInsert, "id" | "slug">) {
  assertAdmin(actor);
  if (data.status === "active" && !data.providerId) {
    throw invalid("Un servicio solo puede marcarse como activo si tiene un proveedor asignado");
  }
  if (data.providerId) {
    const [p] = await db.select().from(providers).where(eq(providers.id, data.providerId));
    if (!p) throw invalid("Proveedor no válido");
    if (data.status === "active" && !p.isActive) throw invalid("El proveedor asignado está inactivo");
  }
  const slug = await uniqueSlug(services, data.title, id ?? undefined);
  if (id) await db.update(services).set({ ...data, slug, updatedAt: new Date() }).where(eq(services.id, id));
  else await db.insert(services).values({ ...data, slug });
  await audit(actor.id, id ? "service.update" : "service.create", "service", id ?? undefined, { title: data.title, priceFrom: data.priceFrom });
}

export async function adminListInquiries(actor: Actor) {
  assertAdmin(actor);
  return db
    .select({ inq: serviceInquiries, serviceTitle: services.title })
    .from(serviceInquiries)
    .innerJoin(services, eq(services.id, serviceInquiries.serviceId))
    .orderBy(desc(serviceInquiries.createdAt))
    .limit(200);
}

export async function adminSetInquiryStatus(actor: Actor, id: string, status: "new" | "contacted" | "closed") {
  assertAdmin(actor);
  await db.update(serviceInquiries).set({ status, updatedAt: new Date() }).where(eq(serviceInquiries.id, id));
}

export async function adminListLeads(actor: Actor) {
  assertAdmin(actor);
  return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(200);
}

export async function adminSetLeadStatus(actor: Actor, id: string, status: "new" | "contacted" | "closed") {
  assertAdmin(actor);
  await db.update(leads).set({ status }).where(eq(leads.id, id));
}

/* --------------------- Oportunidades, eventos, editorial ------------------- */

export async function adminListOpportunities(actor: Actor) {
  assertAdmin(actor);
  return db
    .select({ o: opportunities, applications: sql<number>`(select count(*)::int from opportunity_applications oa where oa.opportunity_id = "opportunities"."id")` })
    .from(opportunities)
    .orderBy(desc(opportunities.createdAt));
}

export async function adminGetOpportunity(actor: Actor, id: string) {
  assertAdmin(actor);
  const [o] = await db.select().from(opportunities).where(eq(opportunities.id, id));
  if (!o) return null;
  const apps = await db
    .select({ app: opportunityApplications, stageName: artists.stageName, slug: artists.slug })
    .from(opportunityApplications)
    .innerJoin(artists, eq(artists.id, opportunityApplications.artistId))
    .where(eq(opportunityApplications.opportunityId, id))
    .orderBy(desc(opportunityApplications.createdAt));
  return { o, apps };
}

export async function adminUpsertOpportunity(actor: Actor, id: string | null, data: Omit<typeof opportunities.$inferInsert, "id" | "slug">) {
  assertAdmin(actor);
  const slug = await uniqueSlug(opportunities, data.title, id ?? undefined);
  const values = { ...data, sponsorName: data.isSponsored ? data.sponsorName : null, slug };
  if (id) await db.update(opportunities).set({ ...values, updatedAt: new Date() }).where(eq(opportunities.id, id));
  else await db.insert(opportunities).values(values);
  await audit(actor.id, id ? "opportunity.update" : "opportunity.create", "opportunity", id ?? undefined, { title: data.title });
}

export async function adminSetApplicationStatus(actor: Actor, id: string, status: "submitted" | "shortlisted" | "selected" | "declined") {
  assertAdmin(actor);
  await db.update(opportunityApplications).set({ status, updatedAt: new Date() }).where(eq(opportunityApplications.id, id));
  await audit(actor.id, "application.status", "application", id, { status });
}

export async function adminListEvents(actor: Actor) {
  assertAdmin(actor);
  return db.select().from(events).orderBy(desc(events.startsAt));
}

export async function adminGetEvent(actor: Actor, id: string) {
  assertAdmin(actor);
  const [e] = await db.select().from(events).where(eq(events.id, id));
  return e ?? null;
}

export async function adminUpsertEvent(actor: Actor, id: string | null, data: Omit<typeof events.$inferInsert, "id" | "slug">) {
  assertAdmin(actor);
  const slug = await uniqueSlug(events, data.title, id ?? undefined);
  const values = { ...data, sponsorName: data.isSponsored ? data.sponsorName : null, slug };
  if (id) await db.update(events).set({ ...values, updatedAt: new Date() }).where(eq(events.id, id));
  else await db.insert(events).values(values);
  await audit(actor.id, id ? "event.update" : "event.create", "event", id ?? undefined, { title: data.title });
}

export async function adminListPosts(actor: Actor) {
  assertAdmin(actor);
  return db.select().from(posts).orderBy(desc(posts.updatedAt));
}

export async function adminGetPost(actor: Actor, id: string) {
  assertAdmin(actor);
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  return p ?? null;
}

export async function adminUpsertPost(actor: Actor, id: string | null, data: Omit<typeof posts.$inferInsert, "id" | "slug" | "authorId" | "publishedAt">) {
  assertAdmin(actor);
  const slug = await uniqueSlug(posts, data.title, id ?? undefined);
  const existing = id ? (await db.select().from(posts).where(eq(posts.id, id)))[0] : undefined;
  const publishedAt = data.status === "published" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);
  const values = { ...data, sponsorName: data.isSponsored ? data.sponsorName : null, slug, publishedAt };
  if (id) await db.update(posts).set({ ...values, updatedAt: new Date() }).where(eq(posts.id, id));
  else await db.insert(posts).values({ ...values, authorId: actor.id });
  await audit(actor.id, id ? "post.update" : "post.create", "post", id ?? undefined, { title: data.title });
}

/* ---------------------------- Destacados (features) ------------------------ */

export async function adminListFeatures(actor: Actor) {
  assertAdmin(actor);
  return db
    .select({ f: features, stageName: artists.stageName, slug: artists.slug })
    .from(features)
    .innerJoin(artists, eq(artists.id, features.artistId))
    .orderBy(desc(features.createdAt));
}

export async function adminAddFeature(
  actor: Actor,
  data: { artistId: string; placement: "home_destacados" | "talento_semana"; kind: "editorial" | "patrocinado"; sponsorName?: string; reason: string; endsAt?: string },
) {
  assertAdmin(actor);
  if (data.kind === "patrocinado" && !data.sponsorName) throw invalid("Indica el patrocinador");
  const [a] = await db.select().from(artists).where(eq(artists.id, data.artistId));
  if (!a || !a.isPublished) throw invalid("Solo se pueden destacar artistas publicados");
  await db.insert(features).values({
    artistId: data.artistId,
    placement: data.placement,
    kind: data.kind,
    sponsorName: data.kind === "patrocinado" ? data.sponsorName : null,
    reason: data.reason,
    endsAt: data.endsAt ? new Date(`${data.endsAt}T23:59:59`) : null,
    createdBy: actor.id,
  });
  await audit(actor.id, "feature.create", "artist", data.artistId, { kind: data.kind, placement: data.placement });
}

export async function adminEndFeature(actor: Actor, featureId: string) {
  assertAdmin(actor);
  await db.update(features).set({ endsAt: new Date() }).where(eq(features.id, featureId));
  await audit(actor.id, "feature.end", "feature", featureId);
}

/* --------------------------------- Denuncias ------------------------------- */

export async function adminListReports(actor: Actor) {
  assertAdmin(actor);
  return db
    .select()
    .from(reports)
    .orderBy(sql`case ${reports.status} when 'open' then 0 when 'reviewing' then 1 else 2 end`, desc(reports.createdAt))
    .limit(200);
}

/**
 * Resolver una denuncia. "actioned" con takedown retira el contenido:
 * - media → estado "removed" (deja de mostrarse)
 * - release → se elimina el lanzamiento
 * - artist → se despublica el perfil
 * - post → se archiva
 */
export async function adminResolveReport(actor: Actor, reportId: string, status: "reviewing" | "actioned" | "dismissed", resolution: string, takedown: boolean) {
  assertAdmin(actor);
  const [r] = await db.select().from(reports).where(eq(reports.id, reportId));
  if (!r) throw notFound();
  await db.transaction(async (tx) => {
    if (status === "actioned" && takedown) {
      if (r.targetType === "media") await tx.update(media).set({ status: "removed", removalReason: resolution, updatedAt: new Date() }).where(eq(media.id, r.targetId));
      if (r.targetType === "artist") await tx.update(artists).set({ isPublished: false, updatedAt: new Date() }).where(eq(artists.id, r.targetId));
      if (r.targetType === "post") await tx.update(posts).set({ status: "archived", updatedAt: new Date() }).where(eq(posts.id, r.targetId));
      if (r.targetType === "release") await tx.delete(releases).where(eq(releases.id, r.targetId));
    }
    await tx.update(reports).set({ status, resolution, updatedAt: new Date() }).where(eq(reports.id, reportId));
  });
  await audit(actor.id, `report.${status}`, r.targetType, r.targetId, { takedown, reportId });
}

export async function adminGenres() {
  return db.select().from(genres).orderBy(genres.sortOrder);
}

export async function adminPendingMedia(actor: Actor) {
  assertAdmin(actor);
  return db
    .select({ m: media, stageName: artists.stageName, slug: artists.slug })
    .from(media)
    .innerJoin(artists, eq(artists.id, media.artistId))
    .where(eq(media.status, "under_review"))
    .orderBy(desc(media.createdAt));
}

export async function adminSetMediaStatus(actor: Actor, mediaId: string, status: "published" | "removed") {
  assertAdmin(actor);
  await db.update(media).set({ status, updatedAt: new Date() }).where(and(eq(media.id, mediaId)));
  await audit(actor.id, `media.${status}`, "media", mediaId);
}
