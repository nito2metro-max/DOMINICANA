import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { ServiceIcon } from "./service-icon";

const iconTones = ["bg-brand-50 text-brand-600", "bg-sun-50 text-sun-600", "bg-rose-50 text-rose-600", "bg-palm-50 text-palm-600"];

export function ServiceCard({ service, available, index = 0 }: { service: Service; available: boolean; index?: number }) {
  return (
    <Link href={`/servicios/${service.slug}`} className="card card-hover group flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid size-11 place-items-center rounded-xl ${iconTones[index % iconTones.length]}`}>
          <ServiceIcon name={service.icon} className="size-5" />
        </div>
        {available ? <Badge tone="palm">Disponible</Badge> : <Badge>Próximamente</Badge>}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{service.category}</p>
      <h3 className="mt-1 text-lg font-bold">{service.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-2">{service.summary}</p>
      <div className="mt-auto flex items-end justify-between pt-5">
        <div>
          <p className="text-xs text-muted">Desde</p>
          <p className="font-bold">
            {formatMoney(service.priceFrom, service.currency)}
            {service.priceIsDemo && service.priceFrom != null && <span className="ml-1.5 align-middle text-[11px] font-semibold text-amber-700">precio demo</span>}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
          Ver detalles <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
