import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import type { ArtistCardData } from "@/server/artists";
import { NEW_ARTIST_DAYS } from "@/server/artists";
import { ArtistAvatar, CoverArt } from "@/components/brand/art";
import { Badge, DemoBadge, SponsoredBadge, VerifiedBadge, genreTone } from "@/components/ui/badge";

export function ArtistCard({ artist, sponsor, editorialNote }: { artist: ArtistCardData; sponsor?: string | null | false; editorialNote?: string }) {
  const isNew = Date.now() - new Date(artist.createdAt).getTime() < NEW_ARTIST_DAYS * 86_400_000;
  return (
    <Link href={`/artistas/${artist.slug}`} className="card card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden bg-canvas">
        {artist.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artist.coverUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <CoverArt seed={artist.slug} color={artist.genreColor} className="transition duration-500 group-hover:scale-[1.03]" label="" />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {sponsor ? <SponsoredBadge sponsor={sponsor} /> : null}
          {artist.isDemo && <DemoBadge />}
          {isNew && <Badge tone="palm">Nuevo</Badge>}
        </div>
      </div>
      <div className="relative flex flex-1 flex-col px-4 pb-4">
        <ArtistAvatar name={artist.stageName} src={artist.avatarUrl} color={artist.genreColor} className="-mt-8 size-16 border-4 border-white text-lg shadow-sm" />
        <h3 className="mt-2 flex items-center gap-1 text-[17px] font-bold leading-snug">
          <span className="truncate">{artist.stageName}</span>
          {artist.verification === "verified" && <VerifiedBadge />}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          {artist.genreName && <Badge tone={genreTone(artist.genreColor)}>{artist.genreName}</Badge>}
          {(artist.city || artist.province) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden /> {artist.city ?? artist.province}
            </span>
          )}
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-2">{editorialNote ?? artist.shortBio}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1" title="Seguidores dentro de esta plataforma">
            <Users className="size-3.5" aria-hidden />
            {artist.followers > 0 ? `${artist.followers} en la plataforma` : "Sin seguidores aún"}
          </span>
          {artist.bookingEnabled && <span className="font-semibold text-palm-600">Disponible para contratación</span>}
        </div>
      </div>
    </Link>
  );
}

export function ArtistCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[16/9] rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton -mt-10 size-16 rounded-full border-4 border-white" />
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-10 w-full" />
      </div>
    </div>
  );
}
