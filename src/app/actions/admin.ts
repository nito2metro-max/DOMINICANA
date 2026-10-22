"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { toActionError } from "@/lib/actions";
import {
  eventAdminSchema,
  featureAdminSchema,
  formToObject,
  opportunityAdminSchema,
  postAdminSchema,
  providerAdminSchema,
  serviceAdminSchema,
  zodErrors,
  type ActionState,
} from "@/lib/validation";
import * as admin from "@/server/admin";
import { userRole } from "@/db/schema";

const uuid = z.uuid();
const idOf = (fd: FormData) => uuid.parse(fd.get("id"));

/** Envoltorio para acciones simples de botón (sin estado de formulario). */
async function simple(fn: (a: Awaited<ReturnType<typeof requireAdmin>>) => Promise<unknown>, path: string) {
  const a = await requireAdmin();
  try {
    await fn(a);
  } catch (e) {
    console.error("[admin]", e);
  }
  revalidatePath(path);
}

/* ------------------------------ Usuarios/artistas ------------------------- */

export async function setUserRoleAction(fd: FormData) {
  const role = z.enum(userRole.enumValues).parse(fd.get("role"));
  await simple((a) => admin.adminSetUserRole(a, idOf(fd), role), "/admin/usuarios");
}

export async function setUserStatusAction(fd: FormData) {
  const status = z.enum(["active", "suspended"]).parse(fd.get("status"));
  await simple((a) => admin.adminSetUserStatus(a, idOf(fd), status), "/admin/usuarios");
}

export async function setArtistPublishedAction(fd: FormData) {
  await simple((a) => admin.adminSetArtistPublished(a, idOf(fd), fd.get("value") === "1"), "/admin/artistas");
}

export async function reviewVerificationAction(fd: FormData) {
  const decision = z.enum(["verified", "rejected"]).parse(fd.get("decision"));
  const note = String(fd.get("note") ?? "").slice(0, 500) || undefined;
  await simple((a) => admin.adminReviewVerification(a, idOf(fd), decision, note), "/admin/verificaciones");
}

export async function setMediaStatusAction(fd: FormData) {
  const status = z.enum(["published", "removed"]).parse(fd.get("status"));
  await simple((a) => admin.adminSetMediaStatus(a, idOf(fd), status), "/admin/contenido");
}

/* ------------------------------ Servicios -------------------------------- */

export async function saveServiceAction(id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const parsed = serviceAdminSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  try {
    await admin.adminUpsertService(a, id, { ...parsed.data, providerId: parsed.data.providerId ?? null });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/servicios");
  redirect("/admin/servicios?guardado=1");
}

export async function saveProviderAction(id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const parsed = providerAdminSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  try {
    await admin.adminUpsertProvider(a, id, { ...parsed.data, contactEmail: parsed.data.contactEmail ?? null, website: parsed.data.website ?? null });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/proveedores");
  return { ok: true, message: "Proveedor guardado" };
}

export async function setInquiryStatusAction(fd: FormData) {
  const status = z.enum(["new", "contacted", "closed"]).parse(fd.get("status"));
  const kind = fd.get("kind");
  await simple((a) => (kind === "lead" ? admin.adminSetLeadStatus(a, idOf(fd), status) : admin.adminSetInquiryStatus(a, idOf(fd), status)), "/admin/contactos");
}

/* -------------------- Oportunidades, eventos, editorial ------------------- */

export async function saveOpportunityAction(id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const parsed = opportunityAdminSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  try {
    await admin.adminUpsertOpportunity(a, id, { ...parsed.data, location: parsed.data.location ?? null, deadline: parsed.data.deadline ?? null, sponsorName: parsed.data.sponsorName ?? null });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/oportunidades");
  redirect("/admin/oportunidades?guardado=1");
}

export async function setApplicationStatusAction(fd: FormData) {
  const status = z.enum(["submitted", "shortlisted", "selected", "declined"]).parse(fd.get("status"));
  const opp = uuid.parse(fd.get("opportunityId"));
  await simple((a) => admin.adminSetApplicationStatus(a, idOf(fd), status), `/admin/oportunidades/${opp}`);
}

export async function saveEventAction(id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const parsed = eventAdminSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  try {
    const { startsAt, ...rest } = parsed.data;
    await admin.adminUpsertEvent(a, id, { ...rest, startsAt: new Date(startsAt), ticketUrl: rest.ticketUrl ?? null, sponsorName: rest.sponsorName ?? null });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/eventos");
  redirect("/admin/eventos?guardado=1");
}

export async function savePostAction(id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const parsed = postAdminSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  try {
    await admin.adminUpsertPost(a, id, { ...parsed.data, artistId: parsed.data.artistId ?? null, sponsorName: parsed.data.sponsorName ?? null });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/editorial");
  redirect("/admin/editorial?guardado=1");
}

export async function addFeatureAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const parsed = featureAdminSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  try {
    await admin.adminAddFeature(a, parsed.data);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/");
  revalidatePath("/admin/destacados");
  return { ok: true, message: "Destacado creado" };
}

export async function endFeatureAction(fd: FormData) {
  await simple((a) => admin.adminEndFeature(a, idOf(fd)), "/admin/destacados");
  revalidatePath("/");
}

/* -------------------------------- Denuncias ------------------------------- */

export async function resolveReportAction(id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const status = z.enum(["reviewing", "actioned", "dismissed"]).safeParse(fd.get("status"));
  const resolution = String(fd.get("resolution") ?? "").trim();
  if (!status.success) return { ok: false, message: "Estado no válido" };
  if (status.data !== "reviewing" && resolution.length < 5) return { ok: false, message: "Describe la resolución (mínimo 5 caracteres)" };
  try {
    await admin.adminResolveReport(a, id, status.data, resolution, fd.get("takedown") === "on");
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/denuncias");
  return { ok: true, message: "Denuncia actualizada" };
}
