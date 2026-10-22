import type { Metadata } from "next";
import { Search } from "lucide-react";
import { listArtists } from "@/server/artists";
import { listOpportunities } from "@/server/catalog";
import { param } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ArtistCard } from "@/components/cards/artist-card";
import { OpportunityCard } from "@/components/cards/opportunity-card";

export const metadata: Metadata = { title: "Buscar" };
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = param((await searchParams).q);
  const [artists, opps] = q ? await Promise.all([listArtists({ q, limit: 12 }), listOpportunities()]) : [null, []];
  const needle = q?.toLowerCase() ?? "";
  const matchingOpps = opps.filter(({ o }) => `${o.title} ${o.summary} ${o.organizer}`.toLowerCase().includes(needle)).slice(0, 6);
  return (
    <>
      <PageHeader title="Buscar">
        <form action="/buscar" role="search" className="flex max-w-xl gap-2">
          <label htmlFor="q" className="sr-only">
            Término de búsqueda
          </label>
          <Input id="q" name="q" type="search" defaultValue={q} placeholder="Artistas, géneros, ciudades, convocatorias…" autoFocus />
          <Button type="submit" className="h-11">
            <Search className="size-4" /> Buscar
          </Button>
        </form>
      </PageHeader>
      <div className="container-page space-y-10 py-10">
        {!q ? (
          <p className="text-muted">Escribe un término para buscar en artistas y oportunidades.</p>
        ) : artists!.items.length + matchingOpps.length === 0 ? (
          <EmptyState icon={Search} title={`Sin resultados para «${q}»`} description="Prueba con otro término o explora por género." />
        ) : (
          <>
            {artists!.items.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-bold">Artistas ({artists!.total})</h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {artists!.items.map((a) => (
                    <ArtistCard key={a.id} artist={a} />
                  ))}
                </div>
              </section>
            )}
            {matchingOpps.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-bold">Oportunidades</h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {matchingOpps.map(({ o }) => (
                    <OpportunityCard key={o.id} o={o} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
