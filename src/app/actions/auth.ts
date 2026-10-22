"use server";
import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, toActionError } from "@/lib/actions";
import { formToObject, loginSchema, registerSchema, zodErrors, type ActionState } from "@/lib/validation";
import { authenticate, registerUser } from "@/server/users";

function safeNext(next: unknown, fallback = "/panel") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}:${parsed.data.email}`, 8, 15 * 60_000).ok) {
    return { ok: false, message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }
  let redirectTo: string;
  try {
    const user = await authenticate(parsed.data.email, parsed.data.password);
    await startSession(user.id);
    redirectTo = safeNext(fd.get("next"), user.role === "admin" ? "/admin" : "/panel");
  } catch (e) {
    return toActionError(e);
  }
  redirect(redirectTo);
}

export async function registerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Revisa los campos marcados" };
  const ip = await clientIp();
  if (!rateLimit(`register:${ip}`, 5, 60 * 60_000).ok) {
    return { ok: false, message: "Demasiados registros desde esta conexión. Inténtalo más tarde." };
  }
  let role: string;
  try {
    const user = await registerUser(parsed.data);
    await startSession(user.id);
    role = user.role;
  } catch (e) {
    return toActionError(e);
  }
  redirect(role === "artist" ? "/panel/perfil?bienvenida=1" : "/panel?bienvenida=1");
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}
