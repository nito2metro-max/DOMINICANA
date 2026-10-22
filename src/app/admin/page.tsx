import { Flag, Inbox, Mail, Users, BadgeCheck, Mic2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { adminMetrics, recentAudit } from "@/server/admin";
import { paymentsEnabled } from "@/lib/payments";
import { bookingStatusLabels, roleLabels } from "@/config/site";
import { formatDateTime } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { Notice, StatCard } from "@/components/ui/misc";

export default async function AdminHome() {
  const admin = await requireAdmin();
  const [m, logs] = await Promise.all([adminMetrics(admin), recentAudit(admin)]);
  return (
    <>
      <PanelTitle title="Resumen" description="Métricas disponibles de la plataforma (datos reales de la base de datos, incluidos los registros de demostración)." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <StatCard label="Usuarios" value={m.usersN} icon={Users} />
        <StatCard label="Artistas (publicados / total)" value={`${m.publishedN} / ${m.artistsN}`} icon={Mic2} />
        <StatCard label="Solicitudes de contratación" value={m.bookingsN} icon={Inbox} />
        <StatCard label="Denuncias abiertas" value={m.openReports} icon={Flag} />
        <StatCard label="Verificaciones pendientes" value={m.pendingVerif} icon={BadgeCheck} />
        <StatCard label="Contactos nuevos" value={m.newInquiries + m.newLeads} icon={Mail} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-bold">Usuarios por rol</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {m.byRole.map((r) => (
              <li key={r.role} className="flex justify-between">
                <span>{roleLabels[r.role]}</span>
                <span className="font-bold tabular-nums">{r.n}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-6">
          <h2 className="font-bold">Contrataciones por estado</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {m.byStatus.length === 0 && <li className="text-muted">Sin solicitudes.</li>}
            {m.byStatus.map((r) => (
              <li key={r.status} className="flex justify-between">
                <span>{bookingStatusLabels[r.status]}</span>
                <span className="font-bold tabular-nums">{r.n}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <Notice tone="info" className="mt-6" title="Monetización">
        Pagos {paymentsEnabled() ? "activados" : "desactivados"}. La plataforma no procesa cobros, suscripciones ni comisiones en esta versión. Consulta docs/PAGOS.md para
        habilitarlos de forma segura.
      </Notice>
      <section className="card mt-6 p-6">
        <h2 className="font-bold">Actividad administrativa reciente</h2>
        {logs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Sin actividad registrada.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {logs.map(({ log, actorName }) => (
              <li key={log.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  <strong>{actorName ?? "Sistema"}</strong> · <code className="rounded bg-canvas px-1">{log.action}</code> {log.targetType}
                </span>
                <span className="text-muted">{formatDateTime(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
