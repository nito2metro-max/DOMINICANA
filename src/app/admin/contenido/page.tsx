import Link from "next/link";
import { Disc3, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { adminPendingMedia } from "@/server/admin";
import { setMediaStatusAction } from "@/app/actions/admin";
import { formatDateTime } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export default async function AdminMedia() {
  const admin = await requireAdmin();
  const rows = await adminPendingMedia(admin);
  return (
    <>
      <PanelTitle title="Contenido en revisión" description="Enlaces a plataformas no reconocidas. Verifica que sean oficiales y autorizados antes de publicarlos." />
      {rows.length === 0 ? (
        <EmptyState icon={Disc3} title="Nada pendiente de revisión" />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ m, stageName, slug }) => (
            <li key={m.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{m.title}</p>
                <p className="text-sm text-muted">
                  <Link href={`/artistas/${slug}`}>{stageName}</Link> · derechos confirmados el {m.rightsConfirmedAt ? formatDateTime(m.rightsConfirmedAt) : "—"}
                </p>
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 truncate text-sm text-brand-600">
                  {m.url} <ExternalLink className="size-3" />
                </a>
              </div>
              <form action={setMediaStatusAction} className="flex gap-2">
                <input type="hidden" name="id" value={m.id} />
                <Button type="submit" name="status" value="published" size="sm">
                  Aprobar
                </Button>
                <Button type="submit" name="status" value="removed" size="sm" variant="outline">
                  Rechazar
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
