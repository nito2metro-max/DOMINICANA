import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, Handshake, Mic2, Search, Sparkles, Store, UserPlus } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/session";
import { latestReleases, listArtists, listGenres, recommendArtists } from "@/server/artists";
import { listFeatured, listOpportunities, listServices, listUpcomingEvents, serviceAvailability, type FeaturedArtist } from "@/server/catalog";
import { LinkButton } from "@/components/ui/button";
import { SectionHeader, Notice } from "@/components/ui/misc";
import { ArtistCard } from "@/components/cards/artist-card";
import { ReleaseCard } from "@/components/cards/release-card";
import { ServiceCard } from "@/components/cards/service-card";
import { OpportunityCard } from "@/components/cards/opportunity-card";
import { EventCard } from "@/components/cards/event-card";
import { HeroVisual } from "@/components/home/hero-visual";
import { paletteFor } from "@/components/brand/art";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [genres, featured, weekly, emerging, releases, recs, services, opportunities, events] = await Promise.all([
    listGenres(),
    listFeatured("home_destacados", 4) as Promise<FeaturedArtist[]>,
    listFeatured("talento_semana", 1) as Promise<FeaturedArtist[]>,
    listArtists({ sort: "recientes", limit: 4 }),
    latestReleases(6),
    recommendArtists(user?.id ?? null, 4),
    listServices(),
    listOpportunities(),
    listUpcomingEvents(3),
  ]);
  const heroArtists = [...featured, ...emerging.items].slice(0, 3);

  return (
    <>
      {/* ------------------------------ HERO ------------------------------ */}
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_10%_0%,#eef4ff_0%,transparent_70%),radial-gradient(40%_40%_at_90%_10%,#fff5ec_0%,transparent_70%)]" />
        <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-sm font-semibold text-brand-700 shadow-sm">
              <Sparkles className="size-4 text-sun-500" /> {siteConfig.tagline}
            </p>
            <h1 className="mt-5 text-[2.5rem] font-extrabold leading-[1.05] sm:text-6xl">
              El talento dominicano <span className="text-brand-600">tiene un lugar aquí</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Descubre nuevas voces del dembow, la bachata, el típico y el merengue. Impulsa tu carrera con servicios profesionales y conecta con quienes contratan
              música en vivo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/artistas" size="lg">
                <Search className="size-5" /> Explorar artistas
              </LinkButton>
              <LinkButton href="/oportunidades" size="lg" variant="outline">
                Descubrir oportunidades <ArrowRight className="size-5" />
              </LinkButton>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6 text-sm">
              <div>
                <dt className="text-muted">Registro</dt>
                <dd className="mt-0.5 font-bold">Gratis para artistas</dd>
              </div>
              <div>
                <dt className="text-muted">Géneros</dt>
                <dd className="mt-0.5 font-bold">{genres.length} categorías</dd>
              </div>
              <div>
                <dt className="text-muted">Promoción</dt>
                <dd className="mt-0.5 font-bold">Siempre etiquetada</dd>
              </div>
            </dl>
          </div>
          <HeroVisual artists={heroArtists} />
        </div>
      </section>

      <div className="container-page mt-6">
        <Notice tone="warn" title="Versión de demostración">
          Los artistas, lanzamientos, eventos y precios marcados con «Demo» son ficticios y solo ilustran cómo funcionará la plataforma.
        </Notice>
      </div>

      {/* ---------------------------- GÉNEROS ----------------------------- */}
      <section className="container-page mt-14">
        <SectionHeader eyebrow="Categorías" title="Explora por género" description="Del perico ripiao al trap caribeño: encuentra artistas según su sonido." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {genres.map((g) => {
            const [c1, c2, c3] = paletteFor(g.color);
            return (
              <Link
                key={g.id}
                href={`/artistas?genero=${g.slug}`}
                className="card-hover group relative overflow-hidden rounded-2xl border border-line p-4"
                style={{ background: `linear-gradient(160deg, ${c3}, #ffffff 75%)` }}
              >
                <span className="mb-6 block h-1.5 w-10 rounded-full" style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
                <p className="font-bold leading-tight">{g.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {g.artistCount} artista{g.artistCount === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* --------------------------- DESTACADOS --------------------------- */}
      <section className="container-page mt-16">
        <SectionHeader
          eyebrow="Selección editorial"
          title="Artistas destacados"
          description="Elegidos por el equipo editorial con criterios públicos. Los espacios patrocinados se identifican siempre."
          href="/artistas"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((a) => (
            <ArtistCard key={a.featureId} artist={a} sponsor={a.featureKind === "patrocinado" && (a.sponsorName ?? "Patrocinado")} />
          ))}
        </div>
      </section>

      {/* ------------------- TALENTO DE LA SEMANA + EMERGENTES ------------ */}
      <section className="container-page mt-16 grid gap-8 lg:grid-cols-[1fr_2fr]">
        {weekly[0] && (
          <div>
            <SectionHeader eyebrow="Talento de la semana" title="En el foco" />
            <ArtistCard artist={weekly[0]} editorialNote={weekly[0].reason} sponsor={weekly[0].featureKind === "patrocinado" && weekly[0].sponsorName} />
          </div>
        )}
        <div>
          <SectionHeader eyebrow="Recién llegados" title="Talentos emergentes" href="/artistas?orden=recientes" />
          <div className="grid gap-5 sm:grid-cols-2">
            {emerging.items.slice(0, 4).map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- LANZAMIENTOS ------------------------- */}
      <section className="mt-16 bg-white py-14">
        <div className="container-page">
          <SectionHeader eyebrow="Música nueva" title="Nuevos lanzamientos" href="/lanzamientos" />
          <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
            {releases.map((r) => (
              <div key={r.id} className="w-[44%] shrink-0 snap-start sm:w-auto">
                <ReleaseCard release={r} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------- RECOMENDACIONES ------------------------ */}
      <section className="container-page mt-16">
        <SectionHeader
          eyebrow={recs.personalized ? "Para ti" : "Para empezar"}
          title="Recomendaciones musicales"
          description={
            recs.personalized
              ? "Basadas en los géneros de los artistas que sigues."
              : "Una muestra variada de cada género. Sigue artistas para recibir recomendaciones personalizadas."
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recs.items.map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </div>
      </section>

      {/* ----------------------------- SERVICIOS -------------------------- */}
      <section className="container-page mt-16">
        <SectionHeader
          eyebrow="Impulsa tu carrera"
          title="Servicios para artistas"
          description="Profesionales y proveedores aliados para diseñar, producir, distribuir y promocionar tu música."
          href="/servicios"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.slice(0, 4).map(({ service, providerActive }, i) => (
            <ServiceCard key={service.id} service={service} index={i} available={serviceAvailability(service, providerActive) === "disponible"} />
          ))}
        </div>
      </section>

      {/* ------------------- OPORTUNIDADES Y EVENTOS ---------------------- */}
      <section className="container-page mt-16 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHeader eyebrow="Convocatorias y contratación" title="Oportunidades abiertas" href="/oportunidades" />
          <div className="grid gap-4 sm:grid-cols-2">
            {opportunities.slice(0, 4).map(({ o }) => (
              <OpportunityCard key={o.id} o={o} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeader eyebrow="Agenda" title="Eventos y showcases" href="/eventos" />
          <div className="grid gap-4">
            {events.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- CTA ARTISTAS ------------------------ */}
      <section className="container-page mt-20">
        <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-6 py-12 text-white sm:px-12 sm:py-16">
          <svg viewBox="0 0 600 300" className="pointer-events-none absolute -right-20 -top-10 h-[130%] opacity-25" aria-hidden>
            {[60, 110, 160, 210, 260].map((r) => (
              <circle key={r} cx="420" cy="150" r={r} fill="none" stroke="#fff" strokeWidth="2" />
            ))}
            <circle cx="420" cy="150" r="22" fill="#f97316" />
          </svg>
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">Para artistas</p>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">Crea tu perfil gratis y empieza a recibir oportunidades</h2>
            <ul className="mt-6 grid gap-3 text-brand-50 sm:grid-cols-2">
              {["Perfil profesional con tu música y enlaces oficiales", "Solicitudes de contratación organizadas", "Acceso a convocatorias y showcases", "Estadísticas reales de tu perfil"].map((t) => (
                <li key={t} className="flex gap-2">
                  <Mic2 className="mt-0.5 size-4 shrink-0 text-sun-100" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/registro?tipo=artist" size="lg" variant="accent">
                <UserPlus className="size-5" /> Registrarme como artista
              </LinkButton>
              <LinkButton href="/servicios" size="lg" className="bg-white/10 text-white hover:bg-white/20">
                Ver servicios
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------- MARCAS, NEGOCIOS, PROMOTORES -------------- */}
      <section className="container-page mt-16">
        <SectionHeader eyebrow="Para negocios" title="Marcas, locales y promotores" description="Encuentra el talento adecuado para tu evento o campaña, con un proceso claro y sin compromisos automáticos." />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Store, title: "Discotecas y restaurantes", text: "Busca artistas por género y zona, y envía solicitudes con fecha, lugar y presupuesto.", href: "/contrataciones", cta: "Contratar artistas", tone: "bg-brand-50 text-brand-600" },
            { icon: CalendarDays, title: "Promotores y festivales", text: "Publica convocatorias de showcase y recibe postulaciones de artistas emergentes.", href: "/negocios", cta: "Publicar convocatoria", tone: "bg-sun-50 text-sun-600" },
            { icon: Building2, title: "Marcas y patrocinadores", text: "Patrocina eventos y campañas con artistas locales. Toda promoción se etiqueta como tal.", href: "/negocios", cta: "Hablar con el equipo", tone: "bg-rose-50 text-rose-600" },
          ].map((c) => (
            <div key={c.title} className="card flex flex-col p-6">
              <div className={`grid size-12 place-items-center rounded-2xl ${c.tone}`}>
                <c.icon className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-2">{c.text}</p>
              <Link href={c.href} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                {c.cta} <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-sm text-muted">
          <Handshake className="mt-0.5 size-5 shrink-0 text-palm-600" />
          La plataforma facilita el contacto y la negociación. Las contrataciones no se confirman automáticamente ni se procesan pagos: los acuerdos finales se firman entre
          las partes.
        </div>
      </section>
    </>
  );
}
