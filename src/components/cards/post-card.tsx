import Link from "next/link";
import type { Post } from "@/db/schema";
import { CoverArt } from "@/components/brand/art";
import { Badge, DemoBadge, SponsoredBadge } from "@/components/ui/badge";
import { postKindLabels } from "@/config/site";
import { formatDate } from "@/lib/utils";

export function PostCard({ post, artistName }: { post: Post; artistName?: string | null }) {
  return (
    <Link href={`/editorial/${post.slug}`} className="card card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden">
        <CoverArt seed={post.slug} color={post.kind === "entrevista" ? "orange" : post.kind === "talento_semana" ? "pink" : "blue"} label="" className="transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge tone="brand" className="bg-white/95">{postKindLabels[post.kind]}</Badge>
          {post.isSponsored && <SponsoredBadge sponsor={post.sponsorName} />}
          {post.isDemo && <DemoBadge />}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug">{post.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-2">{post.excerpt}</p>
        <p className="mt-auto pt-4 text-xs text-muted">
          {post.publishedAt ? formatDate(post.publishedAt) : "Borrador"}
          {artistName ? ` · ${artistName}` : ""}
        </p>
      </div>
    </Link>
  );
}
