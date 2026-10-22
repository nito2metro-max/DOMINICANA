import "server-only";
import { and, asc, desc, eq, gte, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { artistLinks, artists, follows, genres, media, profileViews, releases, verificationRequests, bookingRequests } from "@/db/schema";
import { canEditArtist, isActive, type Actor } from "@/lib/auth/policies";
import { forbidden, invalid, notFound, AppError } from "./errors";
import { uniqueArtistSlug } from "./users";

const followerCount = sql<number>`(select count(*)::int from follows f where f.artist_id = "artists"."id")`;
const recentViews = sql<number>`coalesce((select sum(pv.count)::int from profile_views pv where pv.artist_id = "artists"."id" and pv.day > current_date - 30), 0)`;

export const NEW_ARTIST_DAYS = 45;

export const artistCardFields = {
  id: artists.id,
  slug: artists.slug,
  stageName: artists.stageName,
  shortBio: artists.shortBio,
  province: artists.province,
  city: artists.city,
  avatarUrl: artists.avatarUrl,
  coverUrl: artists.coverUrl,
  verification: artists.verification,
  isDemo: artists.isDemo,
  createdAt: artists.createdAt,
  bookingEnabled: artists.bookingEnabled,
  genreName: genres.name,
  genreSlug: genres.slug,
  genreColor: genres.color,
  followers: followerCount,
};

export type ArtistCardData = {
  id: string;
  slug: string;
  stageName: string;
  shortBio: string;
  province: string | null;
  city: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  verification: "none" | "pending" | "verified" | "rejected";
  isDemo: boolean;
  createdAt: Date;
  bookingEnabled: boolean;
  genreName: string | null;
  genreSlug: string | null;
  genreColor: string | null;
  followers: number;
};

export type ArtistFilters = {
  q?: string;
  genre?: string;
  province?: string;
  sort?: "recientes" | "populares" | "nombre";
  onlyNew?: boolean;
  bookable?: boolean;
  limit?: number;
  offset?: number;
};

export async function listArtists(f: ArtistFilters = {}): Promise<{ items: ArtistCardData[]; total: number }> {
  const conds: SQL[] = [eq(artists.isPublished, true)];
  if (f.q) {
    const term = `%${f.q.replace(/[%_\\]/g, (m) => "\\" + m).slice(0, 60)}%`;
    conds.push(or(ilike(artists.stageName, term), ilike(artists.shortBio, term), ilike(genres.name, term), ilike(artists.city, term))!);
  }
  if (f.genre) conds.push(eq(genres.slug, f.genre));
  if (f.province) conds.push(eq(artists.province, f.province));
  if (f.onlyNew) conds.push(gte(artists.createdAt, sql`now() - interval '${sql.raw(String(NEW_ARTIST_DAYS))} days'`));
  if (f.bookable) conds.push(eq(artists.bookingEnabled, true));
  const where = and(...conds);

  const order =
    f.sort === "populares"
      ? [desc(sql`${followerCount} + ${recentViews}`), asc(artists.stageName)]
      : f.sort === "nombre"
        ? [asc(artists.stageName)]
        : [desc(artists.createdAt), asc(artists.stageName)];

  const items = await db
    .select(artistCardFields)
    .from(artists)
    .leftJoin(genres, eq(genres.id, artists.genreId))
    .where(where)
    .orderBy(...order)
    .limit(Math.min(f.limit ?? 24, 60))
    .offset(f.offset ?? 0);
  const [{ total }] = (await db
    .select({ total: sql<number>`count(*)::int` })
    .from(artists)
    .leftJoin(genres, eq(genres.id, artists.genreId))
    .where(where)) as [{ total: number }];
  return { items, total };
}

export async function listGenres() {
  return db
    .select({
      id: genres.id,
      slug: genres.slug,
      name: genres.name,
      description: genres.description,
      color: genres.color,
      artistCount: sql<number>`(select count(*)::int from artists a where a.genre_id = "genres"."id" and a.is_published)`,
    })
    .from(genres)
    .orderBy(asc(genres.sortOrder));
}

/** Perfil público. Los no publicados solo los ven su dueño y administradores. */
export async function getArtistProfile(slug: string, viewer: Actor | null) {
  const [row] = await db
    .select({ artist: artists, genre: genres, followers: followerCount })
    .from(artists)
    .leftJoin(genres, eq(genres.id, artists.genreId))
    .where(eq(artists.slug, slug))
    .limit(1);
  if (!row) return null;
  if (!row.artist.isPublished && !canEditArtist(viewer, row.artist)) return null;
  const [links, rel, med, following] = await Promise.all([
    db.select().from(artistLinks).where(eq(artistLinks.artistId, row.artist.id)).orderBy(asc(artistLinks.createdAt)),
    db.select().from(releases).where(eq(releases.artistId, row.artist.id)).orderBy(desc(releases.releaseDate)),
    db
      .select()
      .from(media)
      .where(and(eq(media.artistId, row.artist.id), eq(media.status, "published")))
      .orderBy(desc(media.createdAt)),
    viewer
      ? db
          .select({ a: follows.artistId })
          .from(follows)
          .where(and(eq(follows.userId, viewer.id), eq(follows.artistId, row.artist.id)))
      : Promise.resolve([]),
  ]);
  return { ...row, links, releases: rel, media: med, isFollowing: following.length > 0 };
}

export async function getOwnArtist(actor: Actor) {
  if (!isActive(actor) || actor.role !== "artist") return null;
  const [a] = await db.select().from(artists).where(eq(artists.userId, actor.id)).limit(1);
  return a ?? null;
}

async function loadEditableArtist(actor: Actor, artistId: string) {
  const [a] = await db.select().from(artists).where(eq(artists.id, artistId)).limit(1);
  if (!a) throw notFound("Artista no encontrado");
  if (!canEditArtist(actor, a)) throw forbidden();
  return a;
}

export async function updateArtistProfile(
  actor: Actor,
  artistId: string,
  data: {
    stageName: string;
    genreId: string;
    province?: string;
    city?: string;
    shortBio: string;
    bio: string;
    bookingEnabled: boolean;
    isPublished: boolean;
  },
) {
  const a = await loadEditableArtist(actor, artistId);
  const [g] = await db.select({ id: genres.id }).from(genres).where(eq(genres.id, data.genreId));
  if (!g) throw invalid("Género no válido");
  const slug = a.stageName !== data.stageName && !a.isPublished ? await uniqueArtistSlug(data.stageName) : a.slug;
  // Cambiar el nombre de un perfil verificado requiere nueva verificación
  const verification = a.verification === "verified" && a.stageName !== data.stageName ? "none" : a.verification;
  await db
    .update(artists)
    .set({ ...data, province: data.province ?? null, city: data.city ?? null, slug, verification, updatedAt: new Date() })
    .where(eq(artists.id, a.id));
  return { slug };
}

export async function setArtistImage(actor: Actor, artistId: string, field: "avatarUrl" | "coverUrl", url: string) {
  const a = await loadEditableArtist(actor, artistId);
  await db.update(artists).set({ [field]: url, updatedAt: new Date() }).where(eq(artists.id, a.id));
  return a[field];
}

export async function addArtistLink(actor: Actor, artistId: string, data: { platform: string; url: string }) {
  await loadEditableArtist(actor, artistId);
  const [{ n }] = (await db.select({ n: sql<number>`count(*)::int` }).from(artistLinks).where(eq(artistLinks.artistId, artistId))) as [{ n: number }];
  if (n >= 12) throw invalid("Máximo 12 enlaces");
  await db.insert(artistLinks).values({ artistId, ...data });
}

export async function removeArtistLink(actor: Actor, linkId: string) {
  const [l] = await db.select().from(artistLinks).where(eq(artistLinks.id, linkId));
  if (!l) throw notFound();
  await loadEditableArtist(actor, l.artistId);
  await db.delete(artistLinks).where(eq(artistLinks.id, linkId));
}

export async function addRelease(
  actor: Actor,
  artistId: string,
  data: { title: string; type: "single" | "ep" | "album" | "video"; releaseDate?: string; listenUrl?: string; description: string; coverUrl?: string },
) {
  await loadEditableArtist(actor, artistId);
  const [r] = await db.insert(releases).values({ artistId, ...data }).returning();
  return r!;
}

export async function deleteRelease(actor: Actor, releaseId: string) {
  const [r] = await db.select().from(releases).where(eq(releases.id, releaseId));
  if (!r) throw notFound();
  await loadEditableArtist(actor, r.artistId);
  await db.delete(releases).where(eq(releases.id, releaseId));
  return r;
}

export async function addMedia(
  actor: Actor,
  artistId: string,
  data: { title: string; platform: "youtube" | "spotify" | "soundcloud" | "audiomack" | "apple_music" | "other"; url: string; rightsConfirmed: boolean },
) {
  await loadEditableArtist(actor, artistId);
  if (!data.rightsConfirmed) throw invalid("Debes confirmar los derechos del contenido");
  // Los enlaces a plataformas no reconocidas pasan a revisión antes de publicarse
  const status = data.platform === "other" ? "under_review" : "published";
  await db.insert(media).values({ artistId, ...data, rightsConfirmedAt: new Date(), status });
  return status;
}

export async function deleteMedia(actor: Actor, mediaId: string) {
  const [m] = await db.select().from(media).where(eq(media.id, mediaId));
  if (!m) throw notFound();
  await loadEditableArtist(actor, m.artistId);
  await db.delete(media).where(eq(media.id, mediaId));
}

export async function listOwnContent(actor: Actor, artistId: string) {
  await loadEditableArtist(actor, artistId);
  const [links, rel, med] = await Promise.all([
    db.select().from(artistLinks).where(eq(artistLinks.artistId, artistId)).orderBy(asc(artistLinks.createdAt)),
    db.select().from(releases).where(eq(releases.artistId, artistId)).orderBy(desc(releases.releaseDate)),
    db.select().from(media).where(eq(media.artistId, artistId)).orderBy(desc(media.createdAt)),
  ]);
  return { links, releases: rel, media: med };
}

export async function toggleFollow(actor: Actor, artistId: string) {
  if (!isActive(actor)) throw forbidden("Inicia sesión para seguir artistas");
  const [a] = await db.select({ id: artists.id, isPublished: artists.isPublished, userId: artists.userId }).from(artists).where(eq(artists.id, artistId));
  if (!a || !a.isPublished) throw notFound();
  if (a.userId === actor.id) throw invalid("No puedes seguir tu propio perfil");
  const deleted = await db
    .delete(follows)
    .where(and(eq(follows.userId, actor.id), eq(follows.artistId, artistId)))
    .returning();
  if (deleted.length) return false;
  await db.insert(follows).values({ userId: actor.id, artistId }).onConflictDoNothing();
  return true;
}

export async function listFollowed(actor: Actor) {
  return db
    .select(artistCardFields)
    .from(follows)
    .innerJoin(artists, eq(artists.id, follows.artistId))
    .leftJoin(genres, eq(genres.id, artists.genreId))
    .where(and(eq(follows.userId, actor.id), eq(artists.isPublished, true)))
    .orderBy(desc(follows.createdAt));
}

export async function recordProfileView(artistId: string) {
  await db
    .insert(profileViews)
    .values({ artistId, day: sql`current_date`, count: 1 })
    .onConflictDoUpdate({ target: [profileViews.artistId, profileViews.day], set: { count: sql`${profileViews.count} + 1` } });
}

/** Estadísticas internas reales de la plataforma (no de plataformas externas). */
export async function artistStats(actor: Actor, artistId: string) {
  await loadEditableArtist(actor, artistId);
  const [f] = (await db.select({ n: sql<number>`count(*)::int` }).from(follows).where(eq(follows.artistId, artistId))) as [{ n: number }];
  const views = await db
    .select({ day: profileViews.day, count: profileViews.count })
    .from(profileViews)
    .where(and(eq(profileViews.artistId, artistId), gte(profileViews.day, sql`current_date - 29`)))
    .orderBy(asc(profileViews.day));
  const bookings = await db
    .select({ status: bookingRequests.status, n: sql<number>`count(*)::int` })
    .from(bookingRequests)
    .where(eq(bookingRequests.artistId, artistId))
    .groupBy(bookingRequests.status);
  return {
    followers: f.n,
    views30: views.reduce((s, v) => s + v.count, 0),
    viewsByDay: views,
    bookings: Object.fromEntries(bookings.map((b) => [b.status, b.n])) as Partial<Record<string, number>>,
  };
}

export async function requestVerification(actor: Actor, artistId: string, evidence: string) {
  const a = await loadEditableArtist(actor, artistId);
  if (a.verification === "verified") throw invalid("Tu perfil ya está verificado");
  if (a.verification === "pending") throw new AppError("conflict", "Ya tienes una solicitud de verificación en revisión");
  if (!a.isPublished) throw invalid("Publica tu perfil antes de solicitar la verificación");
  await db.transaction(async (tx) => {
    await tx.insert(verificationRequests).values({ artistId, evidence });
    await tx.update(artists).set({ verification: "pending", updatedAt: new Date() }).where(eq(artists.id, artistId));
  });
}

export async function latestReleases(limit = 8) {
  return db
    .select({
      id: releases.id,
      title: releases.title,
      type: releases.type,
      releaseDate: releases.releaseDate,
      coverUrl: releases.coverUrl,
      listenUrl: releases.listenUrl,
      isDemo: releases.isDemo,
      artistName: artists.stageName,
      artistSlug: artists.slug,
      genreName: genres.name,
      genreColor: genres.color,
    })
    .from(releases)
    .innerJoin(artists, eq(artists.id, releases.artistId))
    .leftJoin(genres, eq(genres.id, artists.genreId))
    .where(eq(artists.isPublished, true))
    .orderBy(sql`${releases.releaseDate} desc nulls last`, desc(releases.createdAt))
    .limit(limit);
}

export type ReleaseCardData = Awaited<ReturnType<typeof latestReleases>>[number];

/**
 * Recomendaciones simples y explicables: artistas de los géneros que el usuario sigue,
 * excluyendo los que ya sigue. Sin sesión (o sin seguimientos) se muestra una muestra
 * variada: el artista publicado más reciente de cada género.
 */
export async function recommendArtists(userId: string | null, limit = 4): Promise<{ items: ArtistCardData[]; personalized: boolean }> {
  if (userId) {
    const items = await db
      .select(artistCardFields)
      .from(artists)
      .leftJoin(genres, eq(genres.id, artists.genreId))
      .where(
        and(
          eq(artists.isPublished, true),
          sql`${artists.genreId} in (select a2.genre_id from ${follows} f join ${artists} a2 on a2.id = f.artist_id where f.user_id = ${userId})`,
          sql`${artists.id} not in (select artist_id from ${follows} where user_id = ${userId})`,
          or(sql`${artists.userId} is null`, sql`${artists.userId} <> ${userId}`),
        ),
      )
      .orderBy(desc(artists.createdAt))
      .limit(limit);
    if (items.length) return { items, personalized: true };
  }
  const items = await db
    .selectDistinctOn([artists.genreId], artistCardFields)
    .from(artists)
    .leftJoin(genres, eq(genres.id, artists.genreId))
    .where(eq(artists.isPublished, true))
    .orderBy(artists.genreId, desc(artists.createdAt))
    .limit(limit);
  return { items, personalized: false };
}
