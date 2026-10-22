import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/db/schema";
import { createSessionRecord, deleteSessionRecord, validateSessionToken, type SessionUser } from "@/server/sessions";

export const SESSION_COOKIE = "df_session";

export async function startSession(userId: string) {
  const { token, expiresAt } = await createSessionRecord(userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await deleteSessionRecord(token);
  jar.delete(SESSION_COOKIE);
}

/** Usuario autenticado de la petición actual (memorizado por petición). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  return validateSessionToken(jar.get(SESSION_COOKIE)?.value);
});

/** Exige sesión (y opcionalmente un rol). Redirige si no se cumple. */
export async function requireUser(roles?: Role[], next = "/panel"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  if (roles && !roles.includes(user.role)) redirect("/panel?error=permiso");
  return user;
}

export async function requireAdmin() {
  return requireUser(["admin"], "/admin");
}
