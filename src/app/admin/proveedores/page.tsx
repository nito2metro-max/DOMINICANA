import { requireAdmin } from "@/lib/auth/session";
import { adminListProviders } from "@/server/admin";
import { PanelTitle } from "@/components/layout/panel-title";
import { ProviderForm } from "@/components/admin/forms";
import { Badge, DemoBadge } from "@/components/ui/badge";

export default async function AdminProviders() {
  const admin = await requireAdmin();
  const providers = await adminListProviders(admin);
  return (
    <>
      <PanelTitle title="Proveedores" description="Empresas o profesionales que prestan los servicios. Sin proveedor activo, un servicio se muestra como «Próximamente»." />
      <section className="card mb-6 p-6">
        <h2 className="mb-4 font-bold">Nuevo proveedor</h2>
        <ProviderForm />
      </section>
      <div className="space-y-4">
        {providers.map((p) => (
          <details key={p.id} className="card p-5">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 font-semibold">
              {p.name} {p.isActive ? <Badge tone="palm">Activo</Badge> : <Badge>Inactivo</Badge>} {p.isDemo && <DemoBadge />}
            </summary>
            <div className="mt-4">
              <ProviderForm provider={p} />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
