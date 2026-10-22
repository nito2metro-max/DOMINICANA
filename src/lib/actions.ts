import "server-only";
import { headers } from "next/headers";
import { AppError } from "@/server/errors";
import type { ActionState } from "@/lib/validation";

/** Convierte errores de dominio en mensajes para el usuario sin filtrar detalles internos. */
export function toActionError(err: unknown): ActionState {
  if (err instanceof AppError) return { ok: false, message: err.message };
  console.error("[action] error inesperado", err);
  return { ok: false, message: "Ha ocurrido un error inesperado. Inténtalo de nuevo." };
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
