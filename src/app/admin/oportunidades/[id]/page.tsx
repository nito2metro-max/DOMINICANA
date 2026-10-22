import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { adminGetOpportunity } from "@/server/admin";
import { setApplicationStatusAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { OpportunityForm } from "@/components/admin/forms";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export default async function AdminOpportunityEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const data = id === "nuevo" ? undefined : /^[0-9a-f-]{36}$/.test(id) ? await adminGetOpportunity(admin, id) : null;
  if (data === null) notFound();
  return (
    <>
      <PanelTitle title={data ? `Editar: ${data.o.title}` : "Nueva oportunidad"} />
      <div className="card p-6">
        <OpportunityForm o={data?.o} />
      </div>
      {data && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Postulaciones ({data.apps.length})</h2>
          {data.apps.length === 0 ? (
            <p className="card p-6 text-muted">Aún no hay postulaciones.</p>
          ) : (
            <ul className="space-y-3">
              {data.apps.map(({ app, stageName, slug }) => (
                <li key={app.id} className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/artistas/${slug}`} className="font-bold hover:text-brand-600">
                      {stageName}
                    </Link>
                    <span className="text-xs text-muted">{formatDate(app.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{app.message}</p>
                  <form action={setApplicationStatusAction} className="mt-3 flex items-center gap-2">
                    <input type="hidden" name="id" value={app.id} />
                    <input type="hidden" name="opportunityId" value={data.o.id} />
                    <Select name="status" defaultValue={app.status} className="h-9 max-w-52" aria-label="Estado de la postulación">
                      <option value="submitted">Enviada</option>
                      <option value="shortlisted">Preseleccionada</option>
                      <option value="selected">Seleccionada</option>
                      <option value="declined">No seleccionada</option>
                    </Select>
                    <Button type="submit" size="sm" variant="secondary">
                      Actualizar
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
