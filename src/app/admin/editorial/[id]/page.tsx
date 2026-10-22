import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { adminGetPost, adminListArtists } from "@/server/admin";
import { PanelTitle } from "@/components/layout/panel-title";
import { PostForm } from "@/components/admin/forms";

export default async function AdminPostEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const [post, artists] = await Promise.all([
    id === "nuevo" ? undefined : /^[0-9a-f-]{36}$/.test(id) ? adminGetPost(admin, id) : null,
    adminListArtists(admin),
  ]);
  if (post === null) notFound();
  return (
    <>
      <PanelTitle title={post ? `Editar: ${post.title}` : "Nuevo artículo"} />
      <div className="card p-6">
        <PostForm post={post} artists={artists.map(({ a }) => ({ id: a.id, stageName: a.stageName }))} />
      </div>
    </>
  );
}
