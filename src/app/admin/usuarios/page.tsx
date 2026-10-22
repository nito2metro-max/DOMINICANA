import { requireAdmin } from "@/lib/auth/session";
import { adminListUsers } from "@/server/admin";
import { setUserRoleAction, setUserStatusAction } from "@/app/actions/admin";
import { roleLabels } from "@/config/site";
import { formatDate, param } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { Table, td } from "@/components/admin/table";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/form";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin();
  const q = param((await searchParams).q);
  const rows = await adminListUsers(admin, q);
  return (
    <>
      <PanelTitle title="Usuarios y permisos" description="Cambia roles o suspende cuentas. Suspender cierra todas las sesiones del usuario." />
      <form className="mb-4 max-w-sm">
        <Input name="q" type="search" placeholder="Buscar por nombre o correo…" defaultValue={q} aria-label="Buscar usuarios" />
      </form>
      <Table head={["Usuario", "Rol", "Estado", "Alta", "Acciones"]} empty={rows.length === 0}>
        {rows.map((u) => (
          <tr key={u.id}>
            <td className={td}>
              <p className="font-semibold">
                {u.name} {u.isDemo && <DemoBadge />}
              </p>
              <p className="text-xs text-muted">{u.email}</p>
            </td>
            <td className={td}>
              {u.id === admin.id || u.status === "deleted" ? (
                roleLabels[u.role]
              ) : (
                <form action={setUserRoleAction} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={u.id} />
                  <select name="role" defaultValue={u.role} className="h-9 rounded-lg border border-line bg-white px-2 text-sm" aria-label={`Rol de ${u.name}`}>
                    {Object.entries(roleLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <button className="text-xs font-semibold text-brand-600">Guardar</button>
                </form>
              )}
            </td>
            <td className={td}>
              <Badge tone={u.status === "active" ? "palm" : u.status === "suspended" ? "rose" : "neutral"}>{u.status}</Badge>
            </td>
            <td className={`${td} text-muted`}>{formatDate(u.createdAt)}</td>
            <td className={td}>
              {u.id !== admin.id && u.status !== "deleted" && (
                <form action={setUserStatusAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="status" value={u.status === "active" ? "suspended" : "active"} />
                  <button className={`text-sm font-semibold ${u.status === "active" ? "text-rose-600" : "text-palm-600"} hover:underline`}>
                    {u.status === "active" ? "Suspender" : "Reactivar"}
                  </button>
                </form>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
