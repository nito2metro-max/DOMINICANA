import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { listServices } from "@/server/catalog";
import { formatMoney, param } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { Table, td } from "@/components/admin/table";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";

export default async function AdminServices({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const rows = await listServices(true);
  const saved = param((await searchParams).guardado);
  const st = { active: ["Activo", "palm"], coming_soon: ["Próximamente", "neutral"], hidden: ["Oculto", "rose"] } as const;
  return (
    <>
      <PanelTitle
        title="Servicios"
        description="Administra servicios, precios y proveedores. Un servicio solo puede estar «activo» con un proveedor asignado."
        actions={<LinkButton href="/admin/servicios/nuevo" size="sm"><Plus className="size-4" /> Nuevo servicio</LinkButton>}
      />
      {saved && <Notice tone="success" className="mb-4">Servicio guardado.</Notice>}
      <Table head={["Servicio", "Precio", "Proveedor", "Estado", ""]} empty={rows.length === 0}>
        {rows.map(({ service: s, providerName }) => (
          <tr key={s.id}>
            <td className={td}>
              <p className="font-semibold">{s.title}</p>
              <p className="text-xs text-muted">{s.category}</p>
            </td>
            <td className={td}>
              {formatMoney(s.priceFrom, s.currency)} {s.priceIsDemo && s.priceFrom != null && <Badge tone="warn">demo</Badge>}
            </td>
            <td className={`${td} text-muted`}>{providerName ?? "—"}</td>
            <td className={td}>
              <Badge tone={st[s.status][1]}>{st[s.status][0]}</Badge>
            </td>
            <td className={`${td} text-right`}>
              <Link href={`/admin/servicios/${s.id}`} className="font-semibold text-brand-600">
                Editar
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
