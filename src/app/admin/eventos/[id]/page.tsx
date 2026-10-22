import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { adminGetEvent } from "@/server/admin";
import { PanelTitle } from "@/components/layout/panel-title";
import { EventForm } from "@/components/admin/forms";

export default async function AdminEventEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const ev = id === "nuevo" ? undefined : /^[0-9a-f-]{36}$/.test(id) ? await adminGetEvent(admin, id) : null;
  if (ev === null) notFound();
  return (
    <>
      <PanelTitle title={ev ? `Editar: ${ev.title}` : "Nuevo evento"} />
      <div className="card p-6">
        <EventForm ev={ev} />
      </div>
    </>
  );
}
