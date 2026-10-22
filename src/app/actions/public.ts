"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, toActionError } from "@/lib/actions";
import { bookingRequestSchema, contactSchema, formToObject, leadSchema, reportSchema, applicationSchema, zodErrors, type ActionState } from "@/lib/validation";
import { toggleFollow } from "@/server/artists";
import { createBooking } from "@/server/bookings";
import { applyToOpportunity, createLead, createReport, createServiceInquiry } from "@/server/catalog";

export async function toggleFollowAction(artistId: string, slug: string, _prev: ActionState): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=/artistas/${slug}`);
  try {
    const following = await toggleFollow(user, artistId);
    revalidatePath(`/artistas/${slug}`);
    return { ok: true, message: following ? "Ahora sigues a este artista" : "Has dejado de seguir a este artista" };
  } catch (e) {
    return toActionError(e);
  }
}

export async function createBookingAction(artistId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Inicia sesión para enviar una solicitud" };
  const parsed = bookingRequestSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  if (!rateLimit(`booking:${user.id}`, 10, 60 * 60_000).ok) return { ok: false, message: "Has enviado demasiadas solicitudes. Inténtalo más tarde." };
  let id: string;
  try {
    id = (await createBooking(user, artistId, parsed.data)).id;
  } catch (e) {
    return toActionError(e);
  }
  redirect(`/panel/solicitudes/${id}?enviada=1`);
}

export async function serviceInquiryAction(serviceId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = contactSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  if (!rateLimit(`inquiry:${await clientIp()}`, 6, 60 * 60_000).ok) return { ok: false, message: "Demasiadas solicitudes. Inténtalo más tarde." };
  try {
    await createServiceInquiry(await getCurrentUser(), serviceId, parsed.data);
  } catch (e) {
    return toActionError(e);
  }
  return { ok: true, message: "¡Gracias! Hemos recibido tu solicitud de información. Te responderemos por correo." };
}

export async function leadAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = leadSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  if (!rateLimit(`lead:${await clientIp()}`, 5, 60 * 60_000).ok) return { ok: false, message: "Demasiados envíos. Inténtalo más tarde." };
  try {
    await createLead(parsed.data);
  } catch (e) {
    return toActionError(e);
  }
  return { ok: true, message: "¡Mensaje recibido! El equipo te contactará pronto." };
}

export async function reportAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = reportSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  if (!rateLimit(`report:${await clientIp()}`, 8, 60 * 60_000).ok) return { ok: false, message: "Demasiadas denuncias enviadas. Inténtalo más tarde." };
  try {
    const { goodFaith: _gf, ...data } = parsed.data;
    const id = await createReport(await getCurrentUser(), data);
    return { ok: true, message: `Denuncia registrada (referencia ${id.slice(0, 8)}). El equipo la revisará y te contactará por correo.` };
  } catch (e) {
    return toActionError(e);
  }
}

export async function applyAction(opportunityId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Inicia sesión como artista para postularte" };
  const parsed = applicationSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  try {
    await applyToOpportunity(user, opportunityId, parsed.data.message);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/panel/oportunidades");
  return { ok: true, message: "¡Postulación enviada! Puedes seguir su estado en tu panel." };
}
