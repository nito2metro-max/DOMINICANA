import Link from "next/link";
import { Compass } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listApplicationsForArtistUser, listOpportunities } from "@/server/catalog";
import { opportunityTypeLabels } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { OpportunityCard } from "@/components/cards/opportunity-card";

const appStatus = { submitted: ["Enviada", "neutral"], shortlisted: ["Preseleccionada", "brand"], selected: ["Seleccionada", "palm"], declined: ["No seleccionada", "rose"], withdrawn: ["Retirada", "neutral"] } as const;

export default async function MyOpportunitiesPage() {
  const user = await requireUser(["artist"], "/panel/oportunidades");
  const [apps, open] = await Promise.all([listApplicationsForArtistUser(user), listOpportunities()]);
  const appliedIds = new Set(apps.map((a) => a.app.opportunityId));
  const available = open.filter(({ o }) => !appliedIds.has(o.id));
  return (
    <>
      <PanelTitle title="Oportunidades y campañas" description="Tus postulaciones y nuevas convocatorias abiertas." />
      <section>
        <h2 className="mb-3 text-lg font-bold">Mis postulaciones</h2>
        {apps.length === 0 ? (
          <EmptyState icon={Compass} title="Aún no te has postulado" description="Revisa las convocatorias abiertas más abajo." />
        ) : (
          <ul className="card divide-y divide-line">
            {apps.map(({ app, title, slug, type }) => (
              <li key={app.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/oportunidades/${slug}`} className="font-bold hover:text-brand-600">
                    {title}
                  </Link>
                  <p className="text-sm text-muted">
                    {opportunityTypeLabels[type]} · enviada el {formatDate(app.createdAt)}
                  </p>
                </div>
                <Badge tone={appStatus[app.status][1]}>{appStatus[app.status][0]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold">Convocatorias abiertas</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {available.map(({ o }) => (
            <OpportunityCard key={o.id} o={o} />
          ))}
        </div>
      </section>
    </>
  );
}
