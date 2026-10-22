import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { adminListPosts } from "@/server/admin";
import { postKindLabels } from "@/config/site";
import { formatDate, param } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { Table, td } from "@/components/admin/table";
import { Badge, SponsoredBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";

export default async function AdminPosts({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin();
  const rows = await adminListPosts(admin);
  const saved = param((await searchParams).guardado);
  return (
    <>
      <PanelTitle
        title="Contenido editorial"
        description="Entrevistas, talento de la semana, noticias y anuncios."
        actions={<LinkButton href="/admin/editorial/nuevo" size="sm"><Plus className="size-4" /> Nuevo artículo</LinkButton>}
      />
      {saved && <Notice tone="success" className="mb-4">Artículo guardado.</Notice>}
      <Table head={["Título", "Tipo", "Publicado", "Estado", ""]} empty={rows.length === 0}>
        {rows.map((p) => (
          <tr key={p.id}>
            <td className={td}>
              <p className="font-semibold">{p.title}</p>
              {p.isSponsored && <SponsoredBadge sponsor={p.sponsorName} />}
            </td>
            <td className={td}>{postKindLabels[p.kind]}</td>
            <td className={td}>{p.publishedAt ? formatDate(p.publishedAt) : "—"}</td>
            <td className={td}>
              <Badge tone={p.status === "published" ? "palm" : "neutral"}>{p.status}</Badge>
            </td>
            <td className={`${td} text-right`}>
              <Link href={`/admin/editorial/${p.id}`} className="font-semibold text-brand-600">
                Editar
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
