import Link from "next/link";
import { Flag } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { adminListReports } from "@/server/admin";
import { reportReasonLabels } from "@/config/site";
import { formatDateTime } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ReportResolveForm } from "@/components/admin/forms";

const st = { open: ["Abierta", "rose"], reviewing: ["En revisión", "warn"], actioned: ["Resuelta: procede", "palm"], dismissed: ["Desestimada", "neutral"] } as const;

export default async function AdminReports() {
  const admin = await requireAdmin();
  const rows = await adminListReports(admin);
  return (
    <>
      <PanelTitle title="Denuncias" description="Derechos de autor, suplantación y contenido inapropiado. Proceso de retirada documentado en /legal/derechos." />
      {rows.length === 0 ? (
        <EmptyState icon={Flag} title="No hay denuncias" />
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={st[r.status][1]}>{st[r.status][0]}</Badge>
                <span className="font-bold">{reportReasonLabels[r.reason]}</span>
                <span className="text-sm text-muted">
                  · {r.targetType} · {formatDateTime(r.createdAt)}
                </span>
                {r.isRightsHolder && <Badge tone="brand">Titular de derechos</Badge>}
              </div>
              <p className="mt-3 whitespace-pre-line rounded-xl bg-canvas p-3 text-sm">{r.details}</p>
              <p className="mt-2 text-sm text-muted">
                Denunciante: {r.reporterName} &lt;{r.reporterEmail}&gt; · Objetivo: <code className="text-xs">{r.targetId}</code>
                {r.targetType === "artist" && (
                  <>
                    {" "}
                    · <Link href={`/admin/artistas`} className="text-brand-600">ver artistas</Link>
                  </>
                )}
              </p>
              {r.resolution && <p className="mt-2 text-sm">Resolución: {r.resolution}</p>}
              {(r.status === "open" || r.status === "reviewing") && (
                <div className="mt-4 border-t border-line pt-4">
                  <ReportResolveForm id={r.id} targetType={r.targetType} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
