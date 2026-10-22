"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser, endSession } from "@/lib/auth/session";
import { toActionError } from "@/lib/actions";
import { deleteStoredFile, saveImage } from "@/lib/storage";
import {
  accountSchema,
  artistProfileSchema,
  bookingMessageSchema,
  changePasswordSchema,
  formToObject,
  linkSchema,
  mediaSchema,
  releaseSchema,
  verificationSchema,
  zodErrors,
  type ActionState,
} from "@/lib/validation";
import {
  addArtistLink,
  addMedia,
  addRelease,
  deleteMedia,
  deleteRelease,
  getOwnArtist,
  removeArtistLink,
  requestVerification,
  setArtistImage,
  updateArtistProfile,
} from "@/server/artists";
import { addBookingMessage, changeBookingStatus } from "@/server/bookings";
import { changePassword, deleteAccount, updateAccount } from "@/server/users";
import { bookingStatus } from "@/db/schema";

async function actor() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}

async function ownArtistOrFail() {
  const user = await actor();
  const artist = await getOwnArtist(user);
  if (!artist) return { user, artist: null } as const;
  return { user, artist } as const;
}

const NO_ARTIST: ActionState = { ok: false, message: "Tu cuenta no tiene un perfil de artista" };

/* ------------------------------- Perfil ---------------------------------- */

export async function saveProfileAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { user, artist } = await ownArtistOrFail();
  if (!artist) return NO_ARTIST;
  const parsed = artistProfileSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  try {
    await updateArtistProfile(user, artist.id, parsed.data);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/panel", "layout");
  revalidatePath(`/artistas/${artist.slug}`);
  return { ok: true, message: parsed.data.isPublished ? "Perfil guardado y publicado" : "Perfil guardado (no publicado)" };
}

export async function uploadImageAction(field: "avatarUrl" | "coverUrl", _p: ActionState, fd: FormData): Promise<ActionState> {
  const { user, artist } = await ownArtistOrFail();
  if (!artist) return NO_ARTIST;
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Selecciona una imagen" };
  const res = await saveImage(file, field === "avatarUrl" ? "avatars" : "covers");
  if (!res.ok) return { ok: false, message: res.error };
  try {
    const previous = await setArtistImage(user, artist.id, field, res.url);
    await deleteStoredFile(previous);
  } catch (e) {
    await deleteStoredFile(res.url);
    return toActionError(e);
  }
  revalidatePath("/panel/perfil");
  revalidatePath(`/artistas/${artist.slug}`);
  return { ok: true, message: "Imagen actualizada" };
}

export async function requestVerificationAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { user, artist } = await ownArtistOrFail();
  if (!artist) return NO_ARTIST;
  const parsed = verificationSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  try {
    await requestVerification(user, artist.id, parsed.data.evidence);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/panel/perfil");
  return { ok: true, message: "Solicitud enviada. El equipo la revisará manualmente." };
}

/* --------------------------- Música y contenido --------------------------- */

export async function addLinkAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { user, artist } = await ownArtistOrFail();
  if (!artist) return NO_ARTIST;
  const parsed = linkSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Enlace no válido" };
  try {
    await addArtistLink(user, artist.id, parsed.data);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/panel/musica");
  return { ok: true, message: "Enlace añadido" };
}

export async function removeLinkAction(fd: FormData) {
  const user = await actor();
  const id = z.uuid().safeParse(fd.get("id"));
  if (id.success) await removeArtistLink(user, id.data).catch(() => {});
  revalidatePath("/panel/musica");
}

export async function addReleaseAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { user, artist } = await ownArtistOrFail();
  if (!artist) return NO_ARTIST;
  const parsed = releaseSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  let coverUrl: string | undefined;
  const file = fd.get("cover");
  if (file instanceof File && file.size > 0) {
    const res = await saveImage(file, "releases");
    if (!res.ok) return { ok: false, errors: { cover: [res.error] }, message: res.error };
    coverUrl = res.url;
  }
  try {
    await addRelease(user, artist.id, { ...parsed.data, coverUrl });
  } catch (e) {
    await deleteStoredFile(coverUrl);
    return toActionError(e);
  }
  revalidatePath("/panel/musica");
  return { ok: true, message: "Lanzamiento añadido" };
}

export async function deleteReleaseAction(fd: FormData) {
  const user = await actor();
  const id = z.uuid().safeParse(fd.get("id"));
  if (id.success) {
    const r = await deleteRelease(user, id.data).catch(() => null);
    if (r) await deleteStoredFile(r.coverUrl);
  }
  revalidatePath("/panel/musica");
}

export async function addMediaAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { user, artist } = await ownArtistOrFail();
  if (!artist) return NO_ARTIST;
  const parsed = mediaSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  try {
    const status = await addMedia(user, artist.id, parsed.data);
    revalidatePath("/panel/musica");
    return { ok: true, message: status === "under_review" ? "Contenido enviado a revisión antes de publicarse" : "Contenido publicado" };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteMediaAction(fd: FormData) {
  const user = await actor();
  const id = z.uuid().safeParse(fd.get("id"));
  if (id.success) await deleteMedia(user, id.data).catch(() => {});
  revalidatePath("/panel/musica");
}

/* ------------------------------ Contrataciones ---------------------------- */

export async function bookingStatusAction(bookingId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await actor();
  const to = z.enum(bookingStatus.enumValues).safeParse(fd.get("status"));
  if (!to.success) return { ok: false, message: "Estado no válido" };
  const note = String(fd.get("note") ?? "").slice(0, 1000);
  try {
    await changeBookingStatus(user, bookingId, to.data, note);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath(`/panel/solicitudes/${bookingId}`);
  return { ok: true, message: "Estado actualizado" };
}

export async function bookingMessageAction(bookingId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await actor();
  const parsed = bookingMessageSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  try {
    await addBookingMessage(user, bookingId, parsed.data.body);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath(`/panel/solicitudes/${bookingId}`);
  return { ok: true };
}

/* --------------------------------- Cuenta --------------------------------- */

export async function updateAccountAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await actor();
  const parsed = accountSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  try {
    await updateAccount(user, parsed.data);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Preferencias guardadas" };
}

export async function changePasswordAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await actor();
  const parsed = changePasswordSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  try {
    await changePassword(user, parsed.data.current, parsed.data.next);
  } catch (e) {
    return toActionError(e);
  }
  // Se cierran todas las sesiones; hay que volver a entrar
  await endSession();
  redirect("/entrar?cambio=1");
}

export async function deleteAccountAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await actor();
  if (fd.get("confirm") !== "ELIMINAR") return { ok: false, message: "Escribe ELIMINAR para confirmar" };
  try {
    await deleteAccount(user);
  } catch (e) {
    return toActionError(e);
  }
  await endSession();
  redirect("/?cuenta=eliminada");
}
