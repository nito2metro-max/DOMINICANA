import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listInquiriesForUser, listServices, serviceAvailability } from "@/server/catalog";
import { formatDate } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ServiceCard } from "@/components/cards/service-card";

const st = { new: ["Recibida", "warn"], contacted: ["Contactado", "brand"], closed: ["Cerrada", "neutral"] } as const;

export default async function MyServicesPage() {
  const user = await requireUser();
  const [inq, services] = await Promise.all([listInquiriesForUser(user), listServices()]);
  return (
    <>
      <PanelTitle title="Servicios profesionales" description="Tus solicitudes de información y el catálogo de servicios." />
      <section>
        <h2 className="mb-3 text-lg font-bold">Mis solicitudes</h2>
        {inq.length === 0 ? (
          <EmptyState icon={Sparkles} title="Sin solicitudes de servicio" description="Explora el catálogo y pide información sin compromiso." />
        ) : (
          <ul className="card divide-y divide-line">
            {inq.map(({ inq: i, serviceTitle, serviceSlug }) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/servicios/${serviceSlug}`} className="font-bold hover:text-brand-600">
                    {serviceTitle}
                  </Link>
                  <p className="line-clamp-1 text-sm text-muted">
                    {formatDate(i.createdAt)} · {i.message}
                  </p>
                </div>
                <Badge tone={st[i.status][1]}>{st[i.status][0]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold">Catálogo</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
          {services.map(({ service, providerActive }, i) => (
            <ServiceCard key={service.id} service={service} index={i} available={serviceAvailability(service, providerActive) === "disponible"} />
          ))}
        </div>
      </section>
    </>
  );
}
