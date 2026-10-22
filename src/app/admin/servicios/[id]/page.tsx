import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { adminGetService, adminListProviders } from "@/server/admin";
import { PanelTitle } from "@/components/layout/panel-title";
import { ServiceForm } from "@/components/admin/forms";

export default async function AdminServiceEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const providers = await adminListProviders(admin);
  const service = id === "nuevo" ? undefined : /^[0-9a-f-]{36}$/.test(id) ? await adminGetService(admin, id) : null;
  if (service === null) notFound();
  return (
    <>
      <PanelTitle title={service ? `Editar: ${service.title}` : "Nuevo servicio"} />
      <div className="card p-6">
        <ServiceForm service={service} providers={providers} />
      </div>
    </>
  );
}
