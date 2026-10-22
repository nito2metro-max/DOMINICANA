import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { ReleaseCardData } from "@/server/artists";
import { CoverArt } from "@/components/brand/art";
import { DemoBadge } from "@/components/ui/badge";
import { releaseTypeLabels } from "@/config/site";
import { formatDate } from "@/lib/utils";

export function ReleaseCard({ release }: { release: ReleaseCardData }) {
  return (
    <article className="group">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-canvas shadow-card">
        {release.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={release.coverUrl} alt={`Portada de ${release.title}`} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <CoverArt seed={release.id} color={release.genreColor} label={`Portada ilustrativa de ${release.title}`} className="transition duration-500 group-hover:scale-[1.04]" />
        )}
        {release.isDemo && <DemoBadge className="absolute left-2.5 top-2.5" />}
        {release.listenUrl && (
          <a
            href={release.listenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-ink shadow-sm hover:bg-white"
          >
            Escuchar <ExternalLink className="size-3" />
          </a>
        )}
      </div>
      <div className="mt-3">
        <h3 className="truncate font-bold">{release.title}</h3>
        <p className="truncate text-sm text-muted">
          <Link href={`/artistas/${release.artistSlug}`} className="hover:text-brand-600">
            {release.artistName}
          </Link>{" "}
          · {releaseTypeLabels[release.type]}
          {release.releaseDate ? ` · ${formatDate(release.releaseDate, { year: undefined })}` : ""}
        </p>
      </div>
    </article>
  );
}
