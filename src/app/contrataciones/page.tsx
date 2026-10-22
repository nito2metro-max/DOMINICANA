import type { Metadata } from "next";
import { ClipboardList, Handshake, MessagesSquare, Send, ShieldAlert } from "lucide-react";
import { listArtists } from "@/server/artists";
import { PageHeader, SectionHeader, Notice } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { ArtistCard } from "@/components/cards/artist-card";
import { eventTypeLabels } from "@/config/site";

export const metadata: Metadata = { title: "Contratar artistas", description: "Conecta con artistas dominicanos para discotecas, restaurantes, fiestas, festivales, eventos privados y marcas." };
export const dynamic = "force-dynamic";

export default async function BookingsLandingPage() {
  const { items } = await listArtists({ bookable: true, sort: "populares", limit: 8 });
  const steps = [
    { icon: ClipboardList, t: "Elige un artista", d: "Filtra por género, provincia y disponibilidad." },
    { icon: Send, t: "Envía tu solicitud", d: "Fecha, ubicación, tipo de evento y presupuesto aproximado." },
    { icon: MessagesSquare, t: "Revisen los detalles", d: "Ambas partes conversan y negocian dentro de la plataforma." },
    { icon: Handshake, t: "Acuerden por escrito", d: "Estados claros: pendiente, negociando, aceptada, rechazada o cancelada." },
  ];
  return (
    <>
      <PageHeader eyebrow="Contrataciones" title="Música en vivo para tu evento" description="Un proceso claro para conectar locales, promotores y marcas con talento dominicano.">
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/artistas?contratables=1" size="lg">
            Buscar artistas disponibles
          </LinkButton>
          <LinkButton href="/registro?tipo=promoter" size="lg" variant="outline">
            Crear cuenta de promotor
          </LinkButton>
        </div>
      </PageHeader>
      <div className="container-page py-12">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <s.icon className="size-5" />
                </span>
                <span className="text-sm font-bold text-muted">Paso {i + 1}</span>
              </div>
              <h3 className="mt-3 font-bold">{s.t}</h3>
              <p className="mt-1 text-sm text-ink-2">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-2">
          {Object.values(eventTypeLabels).map((l) => (
            <span key={l} className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-ink-2 ring-1 ring-line">
              {l}
            </span>
          ))}
        </div>
        <Notice tone="warn" className="mt-8">
          <span className="flex gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Una solicitud «aceptada» indica acuerdo de intención, <strong>no una reserva confirmada</strong>. Esta versión no procesa pagos, anticipos ni comisiones.
              Recomendamos firmar un contrato que incluya fecha, horario, honorarios, condiciones técnicas y política de cancelación.
            </span>
          </span>
        </Notice>
        <section className="mt-14">
          <SectionHeader title="Artistas disponibles para contratación" href="/artistas?contratables=1" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
