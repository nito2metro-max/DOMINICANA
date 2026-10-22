import type { Metadata } from "next";
import { CalendarX } from "lucide-react";
import { listUpcomingEvents } from "@/server/catalog";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { EventCard } from "@/components/cards/event-card";

export const metadata: Metadata = { title: "Eventos y showcases" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await listUpcomingEvents(50);
  return (
    <>
      <PageHeader eyebrow="Agenda" title="Eventos y showcases" description="Presentaciones, talleres y festivales con talento emergente dominicano." />
      <div className="container-page py-10">
        {events.length === 0 ? (
          <EmptyState icon={CalendarX} title="No hay eventos próximos" description="Pronto anunciaremos nuevas fechas." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
