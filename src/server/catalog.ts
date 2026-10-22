import "server-only";
import { and, asc, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  artists,
  events,
  features,
  genres,
  leads,
  opportunities,
  opportunityApplications,
  posts,
  providers,
  reports,
  serviceInquiries,
  services,
  media,
  releases,
} from "@/db/schema";
import { isActive, type Actor } from "@/lib/auth/policies";
import { AppError, forbidden, notFound } from "./errors";
import { artistCardFields, type ArtistCardData } from "./artists";

const activeFeature = and(
  sql`${features.startsAt} <= now()`,
  or(isNull(features.endsAt), sql`${features.endsAt} > now()`),
  eq(artists.isPublished, true),
);

/** Artistas destacados con su etiqueta: editorial o patrocinado (nunca se mezclan sin etiquetar). */
export async function listFeatured(placement: "home_destacados" | "talento_semana", limit = 6) {
  return db
    .select({
      ...artistCardFields,
      featureId: features.id,
      featureKind: features.kind,
      sponsorName: features.sponsorName,
      reason: features.reason,
    })
    .from(features)
    .innerJoin(artists, eq(artists.id, features.artistId))
    .leftJoin(genres, eq(genres.id, artists.genreId))
    .where(and(eq(features.placement, placement), activeFeature))
    .orderBy(asc(features.kind), desc(features.startsAt))
    .limit(limit);
}

export type FeaturedArtist = ArtistCardData & {
  featureId: string;
  featureKind: "editorial" | "patrocinado";
  sponsorName: string | null;
  reason: string;
};

/* -------------------------------- Servicios ------------------------------- */

export async function listServices(includeHidden = false) {
  return db
    .select({ service: services, providerName: providers.name, providerActive: providers.isActive })
    .from(services)
    .leftJoin(providers, eq(providers.id, services.providerId))
    .where(includeHidden ? undefined : sql`${services.status} <> 'hidden'`)
    .orderBy(asc(services.sortOrder), asc(services.title));
}

export async function getService(slug: string) {
  const [row] = await db
    .select({ service: services, provider: providers })
    .from(services)
    .leftJoin(providers, eq(providers.id, services.providerId))
    .where(and(eq(services.slug, slug), sql`${services.status} <> 'hidden'`));
  return row ?? null;
}

/**
 * Un servicio solo se puede "contratar" (solicitar información con compromiso)
 * cuando tiene un proveedor activo asignado. Sin proveedor se registra como interés.
 */
export const serviceAvailability = (s: { status: string }, providerActive: boolean | null) =>
  s.status === "active" && providerActive ? "disponible" : "proximamente";

export async function createServiceInquiry(actor: Actor | null, serviceId: string, data: { name: string; email: string; message: string }) {
  const [s] = await db.select().from(services).where(eq(services.id, serviceId));
  if (!s || s.status === "hidden") throw notFound("Servicio no encontrado");
  await db.insert(serviceInquiries).values({ serviceId, userId: actor?.id ?? null, ...data });
}

/* ------------------------------ Oportunidades ----------------------------- */

export async function listOpportunities(type?: string) {
  return db
    .select({ o: opportunities, genreName: genres.name })
    .from(opportunities)
    .leftJoin(genres, eq(genres.id, opportunities.genreId))
    .where(
      and(
        eq(opportunities.status, "published"),
        type ? eq(opportunities.type, type as (typeof opportunities.type.enumValues)[number]) : undefined,
      ),
    )
    .orderBy(sql`${opportunities.deadline} asc nulls last`);
}

export async function getOpportunity(slug: string) {
  const [o] = await db
    .select()
    .from(opportunities)
    .where(and(eq(opportunities.slug, slug), eq(opportunities.status, "published")));
  return o ?? null;
}

export async function applyToOpportunity(actor: Actor, opportunityId: string, message: string) {
  if (!isActive(actor) || actor.role !== "artist") throw forbidden("Solo los artistas pueden postularse");
  const [o] = await db.select().from(opportunities).where(eq(opportunities.id, opportunityId));
  if (!o || o.status !== "published") throw notFound("Oportunidad no disponible");
  if (o.deadline && o.deadline < new Date().toISOString().slice(0, 10)) throw new AppError("invalid", "El plazo de esta convocatoria ha terminado");
  const [a] = await db.select().from(artists).where(eq(artists.userId, actor.id));
  if (!a || !a.isPublished) throw new AppError("invalid", "Publica tu perfil de artista antes de postularte");
  const inserted = await db.insert(opportunityApplications).values({ opportunityId, artistId: a.id, message }).onConflictDoNothing().returning();
  if (!inserted.length) throw new AppError("conflict", "Ya te postulaste a esta oportunidad");
}

export async function listApplicationsForArtistUser(actor: Actor) {
  return db
    .select({ app: opportunityApplications, title: opportunities.title, slug: opportunities.slug, type: opportunities.type })
    .from(opportunityApplications)
    .innerJoin(artists, eq(artists.id, opportunityApplications.artistId))
    .innerJoin(opportunities, eq(opportunities.id, opportunityApplications.opportunityId))
    .where(eq(artists.userId, actor.id))
    .orderBy(desc(opportunityApplications.createdAt));
}

export async function listInquiriesForUser(actor: Actor) {
  return db
    .select({ inq: serviceInquiries, serviceTitle: services.title, serviceSlug: services.slug })
    .from(serviceInquiries)
    .innerJoin(services, eq(services.id, serviceInquiries.serviceId))
    .where(eq(serviceInquiries.userId, actor.id))
    .orderBy(desc(serviceInquiries.createdAt));
}

/* ---------------------------- Eventos y editorial -------------------------- */

export async function listUpcomingEvents(limit = 12) {
  return db
    .select()
    .from(events)
    .where(and(eq(events.status, "published"), gte(events.startsAt, sql`now() - interval '1 day'`)))
    .orderBy(asc(events.startsAt))
    .limit(limit);
}

export async function listPosts(kind?: string, limit = 20) {
  return db
    .select({ post: posts, artistName: artists.stageName, artistSlug: artists.slug, artistAvatar: artists.avatarUrl })
    .from(posts)
    .leftJoin(artists, eq(artists.id, posts.artistId))
    .where(and(eq(posts.status, "published"), kind ? eq(posts.kind, kind as (typeof posts.kind.enumValues)[number]) : undefined))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}

export async function getPost(slug: string) {
  const [row] = await db
    .select({ post: posts, artistName: artists.stageName, artistSlug: artists.slug, artistAvatar: artists.avatarUrl })
    .from(posts)
    .leftJoin(artists, eq(artists.id, posts.artistId))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")));
  return row ?? null;
}

/* ------------------------- Contactos y denuncias -------------------------- */

export async function createLead(data: {
  kind: (typeof leads.kind.enumValues)[number];
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
}) {
  await db.insert(leads).values(data);
}

export async function createReport(
  actor: Actor | null,
  data: {
    targetType: "artist" | "media" | "release" | "post";
    targetId: string;
    reason: (typeof reports.reason.enumValues)[number];
    details: string;
    reporterName: string;
    reporterEmail: string;
    isRightsHolder: boolean;
  },
) {
  const table = { artist: artists, media, release: releases, post: posts }[data.targetType];
  const [exists] = await db.select({ id: table.id }).from(table).where(eq(table.id, data.targetId));
  if (!exists) throw notFound("El contenido denunciado no existe");
  const [r] = await db
    .insert(reports)
    .values({ ...data, reporterId: actor?.id ?? null })
    .returning({ id: reports.id });
  return r!.id;
}
