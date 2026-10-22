import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { listPosts } from "@/server/catalog";
import { postKindLabels } from "@/config/site";
import { cn, param } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { PostCard } from "@/components/cards/post-card";

export const metadata: Metadata = { title: "Editorial", description: "Talento de la semana, entrevistas y anuncios." };
export const dynamic = "force-dynamic";

export default async function EditorialPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const k = param((await searchParams).tipo);
  const kind = k && k in postKindLabels ? k : undefined;
  const posts = await listPosts(kind, 40);
  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title="Historias del talento dominicano"
        description="Selección editorial independiente: las recomendaciones no se venden y el contenido patrocinado se identifica siempre."
      />
      <div className="container-page py-8">
        <nav aria-label="Tipo de artículo" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {([["", "Todo"], ...Object.entries(postKindLabels)] as const).map(([v, l]) => (
            <Link
              key={v}
              href={v ? `/editorial?tipo=${v}` : "/editorial"}
              className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold", (kind ?? "") === v ? "bg-brand-600 text-white" : "bg-white text-ink-2 ring-1 ring-line")}
            >
              {l}
            </Link>
          ))}
        </nav>
        <div className="mt-6">
          {posts.length === 0 ? (
            <EmptyState icon={Newspaper} title="Sin artículos todavía" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(({ post, artistName }) => (
                <PostCard key={post.id} post={post} artistName={artistName} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
