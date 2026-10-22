import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { adminListVerifications } from "@/server/admin";
import { reviewVerificationAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminVerifications() {
  const admin = await requireAdmin();
  const rows = await adminListVerifications(admin);
  return (
    <>
      <PanelTitle title="Solicitudes de verificación" description="Revisa la evidencia manualmente. La verificación nunca se vende." />
      {rows.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="No hay solicitudes" />
      ) : (
        <ul className="space-y-4">
          {rows.map(({ v, stageName, slug }) => (
            <li key={v.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/artistas/${slug}`} className="font-bold hover:text-brand-600">
                  {stageName}
                </Link>
                <Badge tone={v.status === "pending" ? "warn" : v.status === "verified" ? "palm" : "rose"}>{v.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{formatDate(v.createdAt)}</p>
              <p className="mt-3 whitespace-pre-line rounded-xl bg-canvas p-3 text-sm">{v.evidence}</p>
              {v.status === "pending" ? (
                <form action={reviewVerificationAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={v.id} />
                  <input name="note" placeholder="Nota (opcional)" className="h-9 flex-1 rounded-full border border-line px-3 text-sm" aria-label="Nota" />
                  <Button type="submit" name="decision" value="verified" size="sm">
                    Verificar
                  </Button>
                  <Button type="submit" name="decision" value="rejected" size="sm" variant="outline">
                    Rechazar
                  </Button>
                </form>
              ) : (
                v.reviewerNote && <p className="mt-2 text-sm text-muted">Nota: {v.reviewerNote}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
