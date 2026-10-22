import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { adminListEvents } from "@/server/admin";
import { formatDateTime, param } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { Table, td } from "@/components/admin/table";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";

export default async function AdminEvents({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin();
  const rows = await adminListEvents(admin);
  const saved = param((await searchParams).guardado);
  return (
    <>
      <PanelTitle title="Eventos y showcases" actions={<LinkButton href="/admin/eventos/nuevo" size="sm"><Plus className="size-4" /> Nuevo evento</LinkButton>} />
      {saved && <Notice tone="success" className="mb-4">Evento guardado.</Notice>}
      <Table head={["Evento", "Fecha", "Lugar", "Estado", ""]} empty={rows.length === 0}>
        {rows.map((e) => (
          <tr key={e.id}>
            <td className={`${td} font-semibold`}>{e.title}</td>
            <td className={td}>{formatDateTime(e.startsAt)}</td>
            <td className={td}>
              {e.venue}, {e.city}
            </td>
            <td className={td}>
              <Badge tone={e.status === "published" ? "palm" : "neutral"}>{e.status}</Badge>
            </td>
            <td className={`${td} text-right`}>
              <Link href={`/admin/eventos/${e.id}`} className="font-semibold text-brand-600">
                Editar
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
