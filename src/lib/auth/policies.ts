/**
 * Reglas de autorización puras (sin acceso a BD) para poder probarlas de forma aislada.
 * TODA acción del servidor debe pasar por estas funciones antes de leer o modificar datos.
 */
import type { BookingStatus, Role } from "@/db/schema";

export type Actor = { id: string; role: Role; status: "active" | "suspended" | "deleted" };

export const isActive = (a: Actor | null | undefined): a is Actor => !!a && a.status === "active";
export const isAdmin = (a: Actor | null | undefined) => isActive(a) && a.role === "admin";

/** Un artista solo puede editar el perfil vinculado a su propia cuenta. */
export function canEditArtist(actor: Actor | null, artist: { userId: string | null }) {
  if (!isActive(actor)) return false;
  if (actor.role === "admin") return true;
  return actor.role === "artist" && artist.userId === actor.id;
}

/** Quién puede enviar solicitudes de contratación. */
export function canRequestBooking(actor: Actor | null, artist: { userId: string | null; bookingEnabled: boolean; isPublished: boolean }) {
  if (!isActive(actor)) return false;
  if (!artist.bookingEnabled || !artist.isPublished) return false;
  if (artist.userId === actor.id) return false; // no autocontratarse
  return actor.role === "promoter" || actor.role === "fan" || actor.role === "provider" || actor.role === "admin" || actor.role === "artist";
}

export type BookingParty = "artist" | "requester" | "admin" | null;

export function bookingPartyOf(actor: Actor | null, booking: { requesterId: string }, artistUserId: string | null): BookingParty {
  if (!isActive(actor)) return null;
  if (artistUserId && actor.id === artistUserId) return "artist";
  if (actor.id === booking.requesterId) return "requester";
  if (actor.role === "admin") return "admin";
  return null;
}

/**
 * Máquina de estados de una solicitud de contratación.
 * "Aceptada" significa acuerdo de intención entre las partes: NO es una reserva
 * confirmada ni implica pago; eso requiere contrato y validación fuera de la plataforma.
 */
const transitions: Record<BookingStatus, Partial<Record<BookingStatus, Array<Exclude<BookingParty, null>>>>> = {
  pending: { negotiating: ["artist"], accepted: ["artist"], rejected: ["artist"], cancelled: ["requester", "admin"] },
  negotiating: { accepted: ["artist"], rejected: ["artist"], cancelled: ["requester", "artist", "admin"] },
  accepted: { cancelled: ["requester", "artist", "admin"] },
  rejected: {},
  cancelled: {},
};

export function canTransitionBooking(party: BookingParty, from: BookingStatus, to: BookingStatus) {
  if (!party) return false;
  return transitions[from]?.[to]?.includes(party) ?? false;
}

export function allowedBookingTransitions(party: BookingParty, from: BookingStatus): BookingStatus[] {
  if (!party) return [];
  return (Object.keys(transitions[from]) as BookingStatus[]).filter((to) => canTransitionBooking(party, from, to));
}

export const isBookingOpen = (s: BookingStatus) => s === "pending" || s === "negotiating" || s === "accepted";

/** Roles que un usuario puede elegir al registrarse (nunca admin). */
export const selfServiceRoles = ["fan", "artist", "promoter", "provider"] as const;
