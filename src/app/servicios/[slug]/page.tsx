import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Building, Clock } from "lucide-react";
import { getService, serviceAvailability } from "@/server/catalog";
import { getCurrentUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/utils";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/misc";
import { ServiceIcon } from "@/components/cards/service-icon";
import { ServiceInquiryForm } from "@/components/forms/contact-forms";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await getService((await params).slug);
  return row ? { title: row.service.title, description: row.service.summary } : { title: "Servicio no encontrado" };
}

export default async function ServiceDetailPage({ params }: Props) {
  const row = await getService((await params).slug);
  if (!row) notFound();
  const { service, provider } = row;
  const user = await getCurrentUser();
  const available = serviceAvailability(service, provider?.isActive ?? null) === "disponible";

  return (
    <div className="container-page py-10">
      <Link href="/servicios" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Todos los servicios
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <ServiceIcon name={service.icon} className="size-6" />
            </div>
            <div>
              <p className="eyebrow">{service.category}</p>
              <h1 className="text-3xl font-extrabold">{service.title}</h1>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {available ? <Badge tone="palm">Disponible con proveedor aliado</Badge> : <Badge>Próximamente — buscando proveedores</Badge>}
            {service.isDemo && <DemoBadge />}
          </div>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">{service.description}</p>

          <h2 className="mt-8 text-lg font-bold">Entregables</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {service.deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm shadow-card">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-palm-600" /> {d}
              </li>
            ))}
          </ul>

          <h2 className="mt-8 text-lg font-bold">¿Quién presta el servicio?</h2>
          {provider && available ? (
            <div className="card mt-3 flex items-start gap-3 p-4">
              <Building className="mt-0.5 size-5 text-muted" />
              <div>
                <p className="font-semibold">{provider.name}</p>
                <p className="text-sm text-muted">{provider.description}</p>
              </div>
            </div>
          ) : (
            <p className="mt-2 flex items-start gap-2 text-muted">
              <Clock className="mt-0.5 size-4 shrink-0" /> Todavía no hay un proveedor asignado. La plataforma no presta este servicio directamente.
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="text-sm text-muted">Precio orientativo desde</p>
            <p className="mt-1 text-3xl font-extrabold">{formatMoney(service.priceFrom, service.currency)}</p>
            {service.priceIsDemo && service.priceFrom != null && (
              <Notice tone="warn" className="mt-3">
                Precio de demostración: no es una oferta real.
              </Notice>
            )}
            <div className="mt-6">
              <ServiceInquiryForm serviceId={service.id} defaultName={user?.name} defaultEmail={user?.email} available={available} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
