import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { adminListOpportunities } from "@/server/admin";
import { opportunityTypeLabels } from "@/config/site";
import { formatDate, param } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { Table, td } from "@/components/admin/table";
import { Badge, SponsoredBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";

export default async function AdminOpportunities({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin();
  const rows = await adminListOpportunities(admin);
  const saved = param((await searchParams).guardado);
  return (
    <>
      <PanelTitle
        title="Oportunidades y campañas"
        description="Convocatorias, concursos, showcases y campañas. Las patrocinadas se etiquetan automáticamente."
        actions={<LinkButton href="/admin/oportunidades/nuevo" size="sm"><Plus className="size-4" /> Nueva</LinkButton>}
      />
      {saved && <Notice tone="success" className="mb-4">Oportunidad guardada.</Notice>}
      <Table head={["Título", "Tipo", "Cierre", "Postulaciones", "Estado", ""]} empty={rows.length === 0}>
        {rows.map(({ o, applications }) => (
          <tr key={o.id}>
            <td className={td}>
              <p className="font-semibold">{o.title}</p>
              {o.isSponsored && <SponsoredBadge sponsor={o.sponsorName} />}
            </td>
            <td className={td}>{opportunityTypeLabels[o.type]}</td>
            <td className={td}>{o.deadline ? formatDate(o.deadline) : "—"}</td>
            <td className={`${td} tabular-nums`}>{applications}</td>
            <td className={td}>
              <Badge tone={o.status === "published" ? "palm" : "neutral"}>{o.status}</Badge>
            </td>
            <td className={`${td} text-right`}>
              <Link href={`/admin/oportunidades/${o.id}`} className="font-semibold text-brand-600">
                Gestionar
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
