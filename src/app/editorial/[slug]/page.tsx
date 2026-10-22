import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPost } from "@/server/catalog";
import { postKindLabels } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { ArtistAvatar, CoverArt } from "@/components/brand/art";
import { Badge, DemoBadge, SponsoredBadge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/misc";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getPost((await params).slug);
  return r ? { title: r.post.title, description: r.post.excerpt } : { title: "Artículo no encontrado" };
}

export default async function PostPage({ params }: Props) {
  const r = await getPost((await params).slug);
  if (!r) notFound();
  const { post } = r;
  return (
    <article className="pb-10">
      <div className="h-56 overflow-hidden sm:h-80">
        <CoverArt seed={post.slug} color={post.kind === "entrevista" ? "orange" : post.kind === "talento_semana" ? "pink" : "blue"} label="" />
      </div>
      <div className="container-page max-w-3xl">
        <div className="card -mt-20 relative p-6 sm:p-10">
          <Link href="/editorial" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Editorial
          </Link>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge tone="brand">{postKindLabels[post.kind]}</Badge>
            {post.isSponsored && <SponsoredBadge sponsor={post.sponsorName} />}
            {post.isDemo && <DemoBadge />}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-lg text-muted">{post.excerpt}</p>
          <p className="mt-3 text-sm text-muted">{post.publishedAt && formatDate(post.publishedAt)}</p>
          {post.isSponsored && (
            <Notice tone="warn" className="mt-6">
              Artículo patrocinado por <strong>{post.sponsorName}</strong>.
            </Notice>
          )}
          <div className="prose-df mt-8">
            {post.body.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
          {r.artistSlug && r.artistName && (
            <Link href={`/artistas/${r.artistSlug}`} className="mt-8 flex items-center gap-3 rounded-2xl border border-line p-4 hover:bg-canvas">
              <ArtistAvatar name={r.artistName} src={r.artistAvatar} className="size-12 text-sm" />
              <div>
                <p className="text-xs text-muted">Artista mencionado</p>
                <p className="font-bold">{r.artistName}</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
