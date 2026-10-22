import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { listBookingsForActor } from "@/server/bookings";
import { eventTypeLabels } from "@/config/site";
import { formatDate, formatMoney } from "@/lib/utils";
import { BookingStatusBadge } from "@/components/ui/status-badge";

type Row = Awaited<ReturnType<typeof listBookingsForActor>>[number];

export function BookingList({ rows, perspective, hrefBase = "/panel/solicitudes" }: { rows: Row[]; perspective: "artist" | "requester" | "admin"; hrefBase?: string }) {
  return (
    <ul className="card divide-y divide-line overflow-hidden">
      {rows.map((b) => (
        <li key={b.id}>
          <Link href={`${hrefBase}/${b.id}`} className="flex items-center gap-4 p-4 transition hover:bg-canvas">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{perspective === "artist" ? b.organization || b.requesterName : b.artistName}</p>
                <BookingStatusBadge status={b.status} />
              </div>
              <p className="mt-0.5 truncate text-sm text-muted">
                {eventTypeLabels[b.eventType]} · {formatDate(b.eventDate)} · {b.location}
                {perspective === "admin" && ` · ${b.requesterName} → ${b.artistName}`}
              </p>
              {(b.budgetMin || b.budgetMax) && (
                <p className="text-sm text-ink-2">
                  Presupuesto: {b.budgetMin ? formatMoney(b.budgetMin, b.currency) : "—"} – {b.budgetMax ? formatMoney(b.budgetMax, b.currency) : "—"}
                </p>
              )}
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
