import { requireAdmin } from "@/lib/auth/session";
import { adminListArtists, adminListFeatures } from "@/server/admin";
import { endFeatureAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { Table, td } from "@/components/admin/table";
import { Badge, SponsoredBadge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/misc";
import { FeatureForm } from "@/components/admin/forms";

export default async function AdminFeatures() {
  const admin = await requireAdmin();
  const [rows, artists] = await Promise.all([adminListFeatures(admin), adminListArtists(admin)]);
  const now = Date.now();
  return (
    <>
      <PanelTitle title="Artistas destacados" description="Selección editorial y espacios patrocinados." />
      <Notice tone="info" className="mb-6" title="Reglas de transparencia">
        Destacar a un artista no modifica sus estadísticas. Los espacios patrocinados se muestran siempre con la etiqueta «Patrocinado» y el nombre del patrocinador;
        nunca se presentan como recomendación independiente. Cada cambio queda registrado en la auditoría.
      </Notice>
      <section className="card mb-6 p-6">
        <h2 className="mb-4 font-bold">Nuevo destacado</h2>
        <FeatureForm artists={artists.filter(({ a }) => a.isPublished).map(({ a }) => ({ id: a.id, stageName: a.stageName }))} />
      </section>
      <Table head={["Artista", "Ubicación", "Tipo", "Motivo", "Vigencia", ""]} empty={rows.length === 0}>
        {rows.map(({ f, stageName }) => {
          const active = !f.endsAt || f.endsAt.getTime() > now;
          return (
            <tr key={f.id} className={active ? "" : "opacity-50"}>
              <td className={`${td} font-semibold`}>{stageName}</td>
              <td className={td}>{f.placement === "home_destacados" ? "Portada" : "Talento de la semana"}</td>
              <td className={td}>{f.kind === "patrocinado" ? <SponsoredBadge sponsor={f.sponsorName} /> : <Badge tone="brand">Editorial</Badge>}</td>
              <td className={`${td} max-w-60 truncate text-muted`}>{f.reason}</td>
              <td className={td}>{active ? (f.endsAt ? `hasta ${formatDate(f.endsAt)}` : "Activo") : "Finalizado"}</td>
              <td className={`${td} text-right`}>
                {active && (
                  <form action={endFeatureAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <button className="text-sm font-semibold text-rose-600 hover:underline">Finalizar</button>
                  </form>
                )}
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
