import type { Metadata } from "next";
import { BadgeCheck, Megaphone, PartyPopper, Store } from "lucide-react";
import { PageHeader } from "@/components/ui/misc";
import { LeadForm } from "@/components/forms/contact-forms";

export const metadata: Metadata = { title: "Marcas, patrocinadores y negocios" };

export default function BusinessPage() {
  const items = [
    { icon: Megaphone, t: "Campañas con artistas", d: "Contenido y activaciones con talento local, etiquetado siempre como patrocinado." },
    { icon: PartyPopper, t: "Eventos y showcases", d: "Patrocina o coorganiza showcases de nuevos talentos." },
    { icon: Store, t: "Música para tu local", d: "Discotecas, restaurantes y hoteles: encuentra artistas para tu programación." },
    { icon: BadgeCheck, t: "Transparencia", d: "No vendemos recomendaciones editoriales ni manipulamos estadísticas." },
  ];
  return (
    <>
      <PageHeader eyebrow="Para negocios" title="Conecta tu marca con el talento dominicano" description="Patrocinios, campañas y programación musical con reglas claras." />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_480px]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {items.map((i) => (
            <div key={i.t} className="card p-5">
              <i.icon className="size-6 text-brand-600" />
              <h3 className="mt-3 font-bold">{i.t}</h3>
              <p className="mt-1 text-sm text-ink-2">{i.d}</p>
            </div>
          ))}
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold">Hablemos</h2>
          <p className="mb-5 mt-1 text-sm text-muted">Cuéntanos qué buscas y el equipo te responderá.</p>
          <LeadForm />
        </div>
      </div>
    </>
  );
}
