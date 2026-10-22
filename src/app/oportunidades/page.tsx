import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { listOpportunities } from "@/server/catalog";
import { opportunityTypeLabels } from "@/config/site";
import { param, cn } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { OpportunityCard } from "@/components/cards/opportunity-card";

export const metadata: Metadata = { title: "Oportunidades", description: "Convocatorias, concursos, showcases, colaboraciones y contrataciones para artistas dominicanos." };
export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const tipo = param((await searchParams).tipo);
  const type = tipo && tipo in opportunityTypeLabels ? tipo : undefined;
  const items = await listOpportunities(type);
  const tabs = [["", "Todas"], ...Object.entries(opportunityTypeLabels)] as const;
  return (
    <>
      <PageHeader
        eyebrow="Desarrollo de talento"
        title="Oportunidades"
        description="Convocatorias y concursos con reglas transparentes. La selección nunca depende de pagos ni de cifras de seguidores; lo patrocinado se etiqueta."
      />
      <div className="container-page py-8">
        <nav aria-label="Tipo de oportunidad" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {tabs.map(([v, l]) => (
            <Link
              key={v}
              href={v ? `/oportunidades?tipo=${v}` : "/oportunidades"}
              aria-current={(type ?? "") === v ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                (type ?? "") === v ? "bg-brand-600 text-white" : "bg-white text-ink-2 ring-1 ring-line hover:ring-line-strong",
              )}
            >
              {l}
            </Link>
          ))}
        </nav>
        <div className="mt-6">
          {items.length === 0 ? (
            <EmptyState icon={Compass} title="No hay oportunidades abiertas de este tipo" description="Vuelve pronto o revisa otras categorías." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(({ o }) => (
                <OpportunityCard key={o.id} o={o} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
