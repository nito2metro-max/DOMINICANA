import Link from "next/link";
import { CheckCircle2, Circle, Eye, Heart, Inbox, PartyPopper, Search } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { artistStats, getOwnArtist, listFollowed, listOwnContent } from "@/server/artists";
import { listBookingsForActor } from "@/server/bookings";
import { param } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { EmptyState, Notice, StatCard } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { BookingList } from "@/components/panel/booking-list";
import { ArtistCard } from "@/components/cards/artist-card";

export default async function PanelHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const welcome = param(sp.bienvenida) === "1";
  const denied = param(sp.error) === "permiso";

  if (user.role === "artist") {
    const artist = await getOwnArtist(user);
    if (!artist) return <Notice tone="warn">Tu perfil de artista no está disponible. Contacta con soporte.</Notice>;
    const [stats, content, bookings] = await Promise.all([artistStats(user, artist.id), listOwnContent(user, artist.id), listBookingsForActor(user, "received")]);
    const checklist = [
      { done: artist.shortBio.length >= 10 && !!artist.genreId, label: "Completa tu nombre, género y descripción", href: "/panel/perfil" },
      { done: !!artist.avatarUrl, label: "Sube una foto de perfil", href: "/panel/perfil" },
      { done: content.releases.length > 0, label: "Añade tu primer lanzamiento", href: "/panel/musica" },
      { done: content.links.length > 0, label: "Enlaza tus plataformas oficiales", href: "/panel/musica" },
      { done: artist.isPublished, label: "Publica tu perfil", href: "/panel/perfil" },
    ];
    const done = checklist.filter((c) => c.done).length;
    return (
      <>
        <PanelTitle
          title={`Hola, ${artist.stageName}`}
          description="Gestiona tu perfil, tu música y tus oportunidades."
          actions={artist.isPublished ? <LinkButton href={`/artistas/${artist.slug}`} variant="outline" size="sm">Ver perfil público</LinkButton> : undefined}
        />
        {welcome && (
          <Notice tone="success" className="mb-6">
            <span className="flex items-center gap-2">
              <PartyPopper className="size-4" /> ¡Bienvenido! Tu cuenta está creada. Completa tu perfil para aparecer en el catálogo.
            </span>
          </Notice>
        )}
        {denied && <Notice tone="warn" className="mb-6">No tienes permiso para acceder a esa sección.</Notice>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard label="Seguidores en la plataforma" value={stats.followers} icon={Heart} />
          <StatCard label="Visitas al perfil (30 días)" value={stats.views30} icon={Eye} />
          <StatCard label="Solicitudes abiertas" value={(stats.bookings.pending ?? 0) + (stats.bookings.negotiating ?? 0)} icon={Inbox} />
        </div>
        {done < checklist.length && (
          <section className="card mt-6 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Completa tu perfil</h2>
              <span className="text-sm font-semibold text-brand-600">
                {done}/{checklist.length}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(done / checklist.length) * 100}%` }} />
            </div>
            <ul className="mt-4 space-y-2">
              {checklist.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="flex items-center gap-2 text-sm hover:text-brand-600">
                    {c.done ? <CheckCircle2 className="size-5 text-palm-600" /> : <Circle className="size-5 text-line-strong" />}
                    <span className={c.done ? "text-muted line-through" : "font-medium"}>{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Solicitudes recientes</h2>
            <Link href="/panel/solicitudes" className="text-sm font-semibold text-brand-600">
              Ver todas
            </Link>
          </div>
          {bookings.length ? (
            <BookingList rows={bookings.slice(0, 4)} perspective="artist" />
          ) : (
            <EmptyState icon={Inbox} title="Aún no tienes solicitudes" description="Cuando un local o promotor te contacte, lo verás aquí." />
          )}
        </section>
      </>
    );
  }

  const [sent, followed] = await Promise.all([listBookingsForActor(user, "sent"), listFollowed(user)]);
  return (
    <>
      <PanelTitle title={`Hola, ${user.name.split(" ")[0]}`} description="Tus solicitudes y artistas guardados en un solo lugar." />
      {welcome && <Notice tone="success" className="mb-6">¡Bienvenido! Tu cuenta está lista.</Notice>}
      {denied && <Notice tone="warn" className="mb-6">No tienes permiso para acceder a esa sección.</Notice>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Solicitudes enviadas" value={sent.length} icon={Inbox} />
        <StatCard label="En negociación" value={sent.filter((b) => b.status === "negotiating").length} />
        <StatCard label="Artistas guardados" value={followed.length} icon={Heart} />
      </div>
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Solicitudes de contratación</h2>
        {sent.length ? (
          <BookingList rows={sent.slice(0, 5)} perspective="requester" />
        ) : (
          <EmptyState icon={Search} title="Aún no has enviado solicitudes" description="Encuentra artistas para tu evento y envíales una solicitud." action={<LinkButton href="/artistas?contratables=1">Buscar artistas</LinkButton>} />
        )}
      </section>
      {followed.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Artistas que sigues</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {followed.slice(0, 3).map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
