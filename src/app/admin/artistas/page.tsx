import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { adminListArtists } from "@/server/admin";
import { setArtistPublishedAction } from "@/app/actions/admin";
import { param } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { Table, td } from "@/components/admin/table";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/form";

export default async function AdminArtists({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin();
  const q = param((await searchParams).q);
  const rows = await adminListArtists(admin, q);
  const ver = { none: ["Sin verificar", "neutral"], pending: ["Pendiente", "warn"], verified: ["Verificado", "brand"], rejected: ["Rechazada", "rose"] } as const;
  return (
    <>
      <PanelTitle title="Artistas" description="Publica o retira perfiles. Las estadísticas no se pueden editar manualmente." />
      <form className="mb-4 max-w-sm">
        <Input name="q" type="search" placeholder="Buscar por nombre…" defaultValue={q} aria-label="Buscar artistas" />
      </form>
      <Table head={["Artista", "Género", "Cuenta", "Verificación", "Estado", ""]} empty={rows.length === 0}>
        {rows.map(({ a, genreName, ownerEmail }) => (
          <tr key={a.id}>
            <td className={td}>
              <Link href={`/artistas/${a.slug}`} className="font-semibold hover:text-brand-600">
                {a.stageName}
              </Link>{" "}
              {a.isDemo && <DemoBadge />}
            </td>
            <td className={td}>{genreName ?? "—"}</td>
            <td className={`${td} text-muted`}>{ownerEmail ?? "sin cuenta"}</td>
            <td className={td}>
              <Badge tone={ver[a.verification][1]}>{ver[a.verification][0]}</Badge>
            </td>
            <td className={td}>{a.isPublished ? <Badge tone="palm">Publicado</Badge> : <Badge>Oculto</Badge>}</td>
            <td className={`${td} text-right`}>
              <form action={setArtistPublishedAction}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="value" value={a.isPublished ? "0" : "1"} />
                <button className="text-sm font-semibold text-brand-600 hover:underline">{a.isPublished ? "Despublicar" : "Publicar"}</button>
              </form>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
