import Link from "next/link";
import { CalendarClock, MapPin } from "lucide-react";
import type { Opportunity } from "@/db/schema";
import { Badge, DemoBadge, SponsoredBadge } from "@/components/ui/badge";
import { opportunityTypeLabels } from "@/config/site";
import { formatDate } from "@/lib/utils";

const typeTone = { convocatoria: "brand", concurso: "rose", showcase: "sun", colaboracion: "palm", contratacion: "neutral" } as const;

export function OpportunityCard({ o }: { o: Opportunity }) {
  const daysLeft = o.deadline ? Math.ceil((new Date(`${o.deadline}T23:59:59`).getTime() - Date.now()) / 86_400_000) : null;
  return (
    <Link href={`/oportunidades/${o.slug}`} className="card card-hover flex flex-col p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={typeTone[o.type]}>{opportunityTypeLabels[o.type]}</Badge>
        {o.isSponsored && <SponsoredBadge sponsor={o.sponsorName} />}
        {o.isDemo && <DemoBadge />}
      </div>
      <h3 className="mt-3 text-lg font-bold leading-snug">{o.title}</h3>
      <p className="mt-1 text-sm text-muted">{o.organizer}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-2">{o.summary}</p>
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-sm text-muted">
        {o.deadline && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-4" aria-hidden />
            {daysLeft != null && daysLeft >= 0 ? `Cierra en ${daysLeft} día${daysLeft === 1 ? "" : "s"}` : `Cerró el ${formatDate(o.deadline)}`}
          </span>
        )}
        {o.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4" aria-hidden /> {o.location}
          </span>
        )}
      </div>
    </Link>
  );
}
