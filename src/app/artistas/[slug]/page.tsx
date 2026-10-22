import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, Disc3, ExternalLink, Flag, Link2, MapPin, PlayCircle, ShieldCheck, Users, Eye } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { canEditArtist } from "@/lib/auth/policies";
import { getArtistProfile, recordProfileView } from "@/server/artists";
import { toEmbedUrl } from "@/lib/embeds";
import { linkPlatforms, releaseTypeLabels } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { ArtistAvatar, CoverArt } from "@/components/brand/art";
import { Badge, DemoBadge, VerifiedBadge, genreTone } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";
import { FollowButton } from "@/components/artist/follow-button";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getArtistProfile(slug, null);
  if (!p) return { title: "Artista no encontrado" };
  return { title: p.artist.stageName, description: p.artist.shortBio, robots: p.artist.isDemo ? { index: false } : undefined };
}

export default async function ArtistProfilePage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const p = await getArtistProfile(slug, user);
  if (!p) notFound();
  const { artist, genre } = p;
  const isOwner = canEditArtist(user, artist) && user?.role !== "admin";
  if (artist.isPublished && !isOwner) await recordProfileView(artist.id).catch(() => {});
  const platformLabel = (id: string) => linkPlatforms.find((l) => l.id === id)?.label ?? id;

  return (
    <div className="pb-8">
      {/* Portada */}
      <div className="relative h-48 overflow-hidden bg-canvas sm:h-72">
        {artist.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artist.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <CoverArt seed={artist.slug} color={genre?.color} label="" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      <div className="container-page">
        <div className="relative -mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end">
          <ArtistAvatar name={artist.stageName} src={artist.avatarUrl} color={genre?.color} className="size-32 border-[5px] border-white text-4xl shadow-lift sm:size-40" />
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              {artist.isDemo && <DemoBadge label="Perfil de demostración" />}
              {!artist.isPublished && <Badge tone="warn">No publicado — solo tú lo ves</Badge>}
              {genre && (
                <Link href={`/artistas?genero=${genre.slug}`}>
                  <Badge tone={genreTone(genre.color)}>{genre.name}</Badge>
                </Link>
              )}
            </div>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-extrabold sm:text-4xl">
              {artist.stageName}
              {artist.verification === "verified" && <VerifiedBadge />}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
              {(artist.city || artist.province) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" /> {[artist.city, artist.province].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="size-4" /> {p.followers} seguidor{p.followers === 1 ? "" : "es"} en la plataforma
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            {isOwner ? (
              <LinkButton href="/panel/perfil">Editar perfil</LinkButton>
            ) : (
              <>
                {artist.isPublished && <FollowButton artistId={artist.id} slug={artist.slug} following={p.isFollowing} />}
                {artist.bookingEnabled && artist.isPublished && (
                  <LinkButton href={`/artistas/${artist.slug}/contratar`} variant="primary">
                    <CalendarPlus className="size-4" /> Solicitar contratación
                  </LinkButton>
                )}
              </>
            )}
          </div>
        </div>

        {artist.isDemo && (
          <Notice tone="warn" className="mt-6">
            Este es un perfil <strong>ficticio</strong> creado para demostrar la plataforma. No representa a ningún artista real; las solicitudes que envíes servirán solo
            como prueba.
          </Notice>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <section aria-labelledby="bio" className="card p-6">
              <h2 id="bio" className="text-lg font-bold">
                Biografía
              </h2>
              <p className="mt-1 font-medium text-ink-2">{artist.shortBio}</p>
              <div className="prose-df mt-4">
                {(artist.bio || "Este artista aún no ha escrito su biografía.").split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>

            <section aria-labelledby="releases">
              <h2 id="releases" className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Disc3 className="size-5 text-brand-600" /> Canciones y lanzamientos
              </h2>
              {p.releases.length === 0 ? (
                <p className="card p-6 text-muted">Todavía no hay lanzamientos publicados.</p>
              ) : (
                <ul className="card divide-y divide-line">
                  {p.releases.map((r) => (
                    <li key={r.id} className="flex items-center gap-4 p-4">
                      <div className="size-16 shrink-0 overflow-hidden rounded-xl">
                        {r.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.coverUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <CoverArt seed={r.id} color={genre?.color} label="" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{r.title}</p>
                        <p className="text-sm text-muted">
                          {releaseTypeLabels[r.type]}
                          {r.releaseDate && ` · ${formatDate(r.releaseDate)}`}
                          {r.isDemo && " · demo"}
                        </p>
                      </div>
                      {r.listenUrl && (
                        <a href={r.listenUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                          Escuchar <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="media">
              <h2 id="media" className="mb-4 flex items-center gap-2 text-lg font-bold">
                <PlayCircle className="size-5 text-brand-600" /> Videos y contenido
              </h2>
              {p.media.length === 0 ? (
                <p className="card p-6 text-muted">Este artista aún no ha publicado contenido multimedia.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {p.media.map((m) => {
                    const embed = toEmbedUrl(m.platform, m.url);
                    return (
                      <figure key={m.id} className="card overflow-hidden">
                        {embed ? (
                          <iframe
                            src={embed}
                            title={m.title}
                            className={m.platform === "spotify" ? "h-[152px] w-full" : "aspect-video w-full"}
                            loading="lazy"
                            allow="encrypted-media; picture-in-picture; fullscreen"
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        ) : (
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex aspect-video items-center justify-center gap-2 bg-canvas font-semibold text-brand-600">
                            Abrir en la plataforma oficial <ExternalLink className="size-4" />
                          </a>
                        )}
                        <figcaption className="flex items-center justify-between gap-2 p-3 text-sm">
                          <span className="truncate font-semibold">{m.title}</span>
                          <Link href={`/reportar?tipo=media&id=${m.id}`} className="shrink-0 text-xs text-muted hover:text-rose-600">
                            Reportar
                          </Link>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <div className="card p-5">
              <h2 className="font-bold">Escúchalo en</h2>
              {p.links.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Sin enlaces a plataformas todavía.</p>
              ) : (
                <ul className="mt-3 grid gap-2">
                  {p.links.map((l) => (
                    <li key={l.id}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm font-semibold hover:border-brand-300 hover:bg-brand-50"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Link2 className="size-4 text-muted" /> {platformLabel(l.platform)}
                        </span>
                        <ExternalLink className="size-3.5 text-muted" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5">
              <h2 className="font-bold">Estadísticas disponibles</h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-canvas p-3">
                  <dt className="flex items-center gap-1 text-muted">
                    <Users className="size-3.5" /> Seguidores
                  </dt>
                  <dd className="mt-1 text-xl font-extrabold">{p.followers}</dd>
                </div>
                <div className="rounded-xl bg-canvas p-3">
                  <dt className="flex items-center gap-1 text-muted">
                    <Eye className="size-3.5" /> En la plataforma desde
                  </dt>
                  <dd className="mt-1 font-bold">{formatDate(artist.createdAt, { day: undefined })}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted">Solo mostramos datos medidos en esta plataforma. No mostramos reproducciones ni seguidores de servicios externos sin verificar.</p>
            </div>

            <div className="card p-5 text-sm">
              <p className="flex items-start gap-2 text-muted">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-palm-600" />
                {artist.verification === "verified"
                  ? "Identidad verificada por el equipo de la plataforma."
                  : "Perfil no verificado. La verificación confirma que la cuenta pertenece al artista."}
              </p>
              <Link href={`/reportar?tipo=artist&id=${artist.id}`} className="mt-4 inline-flex items-center gap-1.5 font-semibold text-muted hover:text-rose-600">
                <Flag className="size-4" /> Reportar este perfil
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
