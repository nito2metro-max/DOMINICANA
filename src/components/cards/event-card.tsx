import { MapPin, Ticket } from "lucide-react";
import type { Event } from "@/db/schema";
import { Badge, DemoBadge, SponsoredBadge } from "@/components/ui/badge";

export function EventCard({ e }: { e: Event }) {
  const d = new Date(e.startsAt);
  const month = new Intl.DateTimeFormat("es-DO", { month: "short" }).format(d).replace(".", "");
  const time = new Intl.DateTimeFormat("es-DO", { weekday: "long", hour: "numeric", minute: "2-digit" }).format(d);
  return (
    <article className="card flex gap-4 p-4 sm:p-5">
      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 py-2 text-brand-700">
        <span className="text-xs font-bold uppercase">{month}</span>
        <span className="text-2xl font-extrabold leading-none">{d.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="sun">{e.kind}</Badge>
          {e.isSponsored && <SponsoredBadge sponsor={e.sponsorName} />}
          {e.isDemo && <DemoBadge />}
        </div>
        <h3 className="mt-2 font-bold leading-snug">{e.title}</h3>
        <p className="mt-0.5 text-sm capitalize text-muted">{time}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
          <MapPin className="size-3.5" aria-hidden /> {e.venue}, {e.city}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-ink-2">{e.description}</p>
        {e.ticketUrl && (
          <a href={e.ticketUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
            <Ticket className="size-4" /> Información y entradas
          </a>
        )}
      </div>
    </article>
  );
}
