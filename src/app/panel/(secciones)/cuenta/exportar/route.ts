import { getCurrentUser } from "@/lib/auth/session";
import { exportAccountData } from "@/server/users";

/** Descarga de datos personales (derecho de acceso/portabilidad). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("No autorizado", { status: 401 });
  const data = await exportAccountData(user);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mis-datos.json"`,
      "Cache-Control": "no-store",
    },
  });
}
