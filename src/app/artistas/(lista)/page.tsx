import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { provinces } from "@/config/site";
import { listArtists, listGenres } from "@/server/artists";
import { param } from "@/lib/utils";
import { ArtistCard, ArtistCardSkeleton } from "@/components/cards/artist-card";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Input, Select } from "@/components/ui/form";
import { Button, LinkButton } from "@/components/ui/button";
import { AutoSubmitForm } from "@/components/ui/auto-submit-form";

export const metadata: Metadata = { title: "Artistas", description: "Descubre artistas dominicanos emergentes por género, provincia y popularidad en la plataforma." };
export const dynamic = "force-dynamic";

const PAGE = 12;

export default async function ArtistsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = param(sp.q);
  const genre = param(sp.genero);
  const province = param(sp.provincia);
  const sortParam = param(sp.orden);
  const sort: "recientes" | "populares" | "nombre" = sortParam === "populares" || sortParam === "nombre" ? sortParam : "recientes";
  const onlyNew = param(sp.nuevos) === "1";
  const bookable = param(sp.contratables) === "1";
  const page = Math.max(1, Number(param(sp.pagina) ?? 1) || 1);

  const genres = await listGenres();
  const filters = { q, genre, province, sort, sortParam, onlyNew, bookable, page };
  const hasFilters = !!(q || genre || province || onlyNew || bookable);
  return (
    <>
      <PageHeader eyebrow="Descubre" title="Artistas dominicanos" description="Explora talento emergente por género, provincia y actividad en la plataforma." />
      <div className="container-page py-8">
        <AutoSubmitForm action="/artistas" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <div>
            <label htmlFor="q" className="sr-only">
              Buscar
            </label>
            <Input id="q" name="q" type="search" placeholder="Nombre, estilo o ciudad…" defaultValue={q} />
          </div>
          <div>
            <label htmlFor="genero" className="sr-only">
              Género
            </label>
            <Select id="genero" name="genero" defaultValue={genre ?? ""}>
              <option value="">Todos los géneros</option>
              {genres.map((g) => (
                <option key={g.id} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="provincia" className="sr-only">
              Provincia
            </label>
            <Select id="provincia" name="provincia" defaultValue={province ?? ""}>
              <option value="">Todas las provincias</option>
              {provinces.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="orden" className="sr-only">
              Ordenar por
            </label>
            <Select id="orden" name="orden" defaultValue={sort}>
              <option value="recientes">Recién incorporados</option>
              <option value="populares">Popularidad en la plataforma</option>
              <option value="nombre">Nombre (A–Z)</option>
            </Select>
          </div>
          <Button type="submit" variant="primary" className="h-11">
            <SlidersHorizontal className="size-4" /> Filtrar
          </Button>
          <div className="flex flex-wrap gap-x-5 gap-y-2 sm:col-span-2 lg:col-span-5">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="nuevos" value="1" defaultChecked={onlyNew} className="size-4 accent-brand-600" /> Solo nuevos (últimos 45 días)
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="contratables" value="1" defaultChecked={bookable} className="size-4 accent-brand-600" /> Disponibles para contratación
            </label>
          </div>
        </AutoSubmitForm>

        <Suspense key={JSON.stringify(filters)} fallback={<ResultsSkeleton />}>
          <Results {...filters} hasFilters={hasFilters} />
        </Suspense>
      </div>
    </>
  );
}

type ResultsProps = {
  q?: string;
  genre?: string;
  province?: string;
  sort: "recientes" | "populares" | "nombre";
  sortParam?: string;
  onlyNew: boolean;
  bookable: boolean;
  page: number;
  hasFilters: boolean;
};

async function Results({ q, genre, province, sort, sortParam, onlyNew, bookable, page, hasFilters }: ResultsProps) {
  const { items, total } = await listArtists({ q, genre, province, sort, onlyNew, bookable, limit: PAGE, offset: (page - 1) * PAGE });
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (genre) u.set("genero", genre);
    if (province) u.set("provincia", province);
    if (sortParam) u.set("orden", sortParam);
    if (onlyNew) u.set("nuevos", "1");
    if (bookable) u.set("contratables", "1");
    u.set("pagina", String(p));
    return `/artistas?${u}`;
  };
  return (
    <>
        <div className="mt-6 flex items-center justify-between text-sm text-muted">
        <p aria-live="polite">
          {total} artista{total === 1 ? "" : "s"}
          {hasFilters ? " con estos filtros" : ""}
        </p>
        {hasFilters && (
          <Link href="/artistas" className="font-semibold text-brand-600">
            Limpiar filtros
          </Link>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">La popularidad se calcula solo con seguidores y visitas dentro de esta plataforma; no se muestran cifras de servicios externos.</p>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={SearchX}
            title="No encontramos artistas"
            description="Prueba con otro género, provincia o término de búsqueda."
            action={<LinkButton href="/artistas" variant="secondary">Ver todos los artistas</LinkButton>}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Paginación" className="mt-10 flex items-center justify-center gap-2">
          {page > 1 && <LinkButton href={qs(page - 1)} variant="outline" size="sm">Anterior</LinkButton>}
          <span className="px-3 text-sm text-muted">
            Página {page} de {pages}
          </span>
          {page < pages && <LinkButton href={qs(page + 1)} variant="outline" size="sm">Siguiente</LinkButton>}
        </nav>
      )}
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-6" aria-busy="true" aria-label="Cargando artistas">
      <div className="skeleton h-5 w-40" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ArtistCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
