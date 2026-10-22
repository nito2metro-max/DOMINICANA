import "server-only";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { artists, bookingMessages, bookingRequests, users, type BookingStatus } from "@/db/schema";
import {
  allowedBookingTransitions,
  bookingPartyOf,
  canRequestBooking,
  canTransitionBooking,
  isActive,
  isBookingOpen,
  type Actor,
} from "@/lib/auth/policies";
import { bookingStatusLabels } from "@/config/site";
import { AppError, forbidden, invalid, notFound } from "./errors";

type BookingInput = {
  eventType: (typeof bookingRequests.eventType.enumValues)[number];
  eventDate: string;
  location: string;
  organization?: string;
  budgetMin?: number;
  budgetMax?: number;
  details: string;
};

export async function createBooking(actor: Actor, artistId: string, data: BookingInput) {
  const [a] = await db.select().from(artists).where(eq(artists.id, artistId));
  if (!a) throw notFound("Artista no encontrado");
  if (!canRequestBooking(actor, a)) throw forbidden("Este artista no acepta solicitudes en este momento o no puedes enviarle una");
  // Evita spam: máximo 3 solicitudes abiertas del mismo solicitante al mismo artista
  const [{ n }] = (await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookingRequests)
    .where(
      and(
        eq(bookingRequests.artistId, artistId),
        eq(bookingRequests.requesterId, actor.id),
        inArray(bookingRequests.status, ["pending", "negotiating"]),
      ),
    )) as [{ n: number }];
  if (n >= 3) throw new AppError("rate_limited", "Ya tienes varias solicitudes abiertas con este artista");
  const [b] = await db
    .insert(bookingRequests)
    .values({ artistId, requesterId: actor.id, ...data })
    .returning();
  return b!;
}

const requester = alias(users, "requester");

export async function listBookingsForActor(actor: Actor, scope: "received" | "sent" | "all") {
  if (!isActive(actor)) throw forbidden();
  const own = await db.select({ id: artists.id }).from(artists).where(eq(artists.userId, actor.id));
  const ownArtistId = own[0]?.id;
  let where;
  if (scope === "all") {
    if (actor.role !== "admin") throw forbidden();
  } else if (scope === "received") {
    if (!ownArtistId) return [];
    where = eq(bookingRequests.artistId, ownArtistId);
  } else {
    where = eq(bookingRequests.requesterId, actor.id);
  }
  return db
    .select({
      id: bookingRequests.id,
      status: bookingRequests.status,
      eventType: bookingRequests.eventType,
      eventDate: bookingRequests.eventDate,
      location: bookingRequests.location,
      budgetMin: bookingRequests.budgetMin,
      budgetMax: bookingRequests.budgetMax,
      currency: bookingRequests.currency,
      createdAt: bookingRequests.createdAt,
      updatedAt: bookingRequests.updatedAt,
      artistName: artists.stageName,
      artistSlug: artists.slug,
      requesterName: requester.name,
      organization: bookingRequests.organization,
    })
    .from(bookingRequests)
    .innerJoin(artists, eq(artists.id, bookingRequests.artistId))
    .innerJoin(requester, eq(requester.id, bookingRequests.requesterId))
    .where(where)
    .orderBy(desc(bookingRequests.updatedAt))
    .limit(200);
}

async function loadBookingWithParty(actor: Actor, bookingId: string) {
  const [row] = await db
    .select({ booking: bookingRequests, artistUserId: artists.userId })
    .from(bookingRequests)
    .innerJoin(artists, eq(artists.id, bookingRequests.artistId))
    .where(eq(bookingRequests.id, bookingId));
  if (!row) throw notFound("Solicitud no encontrada");
  const party = bookingPartyOf(actor, row.booking, row.artistUserId);
  // Se responde "no encontrada" para no revelar la existencia de solicitudes ajenas
  if (!party) throw notFound("Solicitud no encontrada");
  return { ...row, party };
}

export async function getBookingDetail(actor: Actor, bookingId: string) {
  const { booking, party } = await loadBookingWithParty(actor, bookingId);
  const [[artist], [req], messages] = await Promise.all([
    db
      .select({ stageName: artists.stageName, slug: artists.slug, avatarUrl: artists.avatarUrl })
      .from(artists)
      .where(eq(artists.id, booking.artistId)),
    db.select({ name: users.name, email: users.email, role: users.role }).from(users).where(eq(users.id, booking.requesterId)),
    db
      .select({
        id: bookingMessages.id,
        body: bookingMessages.body,
        statusChange: bookingMessages.statusChange,
        createdAt: bookingMessages.createdAt,
        authorId: bookingMessages.authorId,
        authorName: users.name,
      })
      .from(bookingMessages)
      .leftJoin(users, eq(users.id, bookingMessages.authorId))
      .where(eq(bookingMessages.bookingId, bookingId))
      .orderBy(asc(bookingMessages.createdAt)),
  ]);
  // El correo del solicitante solo se comparte con el artista cuando hay negociación o acuerdo
  const shareContact = party === "admin" || party === "requester" || booking.status === "negotiating" || booking.status === "accepted";
  return {
    booking,
    party,
    artist: artist!,
    requester: { name: req!.name, role: req!.role, email: shareContact ? req!.email : null },
    messages,
    allowed: allowedBookingTransitions(party, booking.status),
  };
}

export async function changeBookingStatus(actor: Actor, bookingId: string, to: BookingStatus, note?: string) {
  const { booking, party } = await loadBookingWithParty(actor, bookingId);
  if (!canTransitionBooking(party, booking.status, to)) {
    throw forbidden(`No se puede pasar de "${bookingStatusLabels[booking.status]}" a "${bookingStatusLabels[to]}"`);
  }
  await db.transaction(async (tx) => {
    // Actualización condicionada al estado leído para evitar condiciones de carrera
    const updated = await tx
      .update(bookingRequests)
      .set({ status: to, updatedAt: new Date() })
      .where(and(eq(bookingRequests.id, bookingId), eq(bookingRequests.status, booking.status)))
      .returning({ id: bookingRequests.id });
    if (!updated.length) throw new AppError("conflict", "La solicitud cambió mientras tanto. Recarga la página.");
    await tx.insert(bookingMessages).values({
      bookingId,
      authorId: actor.id,
      statusChange: to,
      body: note?.trim() || `Estado cambiado a ${bookingStatusLabels[to]}`,
    });
  });
}

export async function addBookingMessage(actor: Actor, bookingId: string, body: string) {
  const { booking } = await loadBookingWithParty(actor, bookingId);
  if (!isBookingOpen(booking.status)) throw invalid("La solicitud está cerrada");
  await db.insert(bookingMessages).values({ bookingId, authorId: actor.id, body });
  await db.update(bookingRequests).set({ updatedAt: new Date() }).where(eq(bookingRequests.id, bookingId));
}

export async function countOpenBookingsForArtistUser(userId: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookingRequests)
    .innerJoin(artists, eq(artists.id, bookingRequests.artistId))
    .where(and(eq(artists.userId, userId), or(eq(bookingRequests.status, "pending"), eq(bookingRequests.status, "negotiating"))));
  return r?.n ?? 0;
}
