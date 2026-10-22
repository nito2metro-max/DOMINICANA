import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { listBookingsForActor } from "@/server/bookings";
import { PanelTitle } from "@/components/layout/panel-title";
import { EmptyState } from "@/components/ui/misc";
import { BookingList } from "@/components/panel/booking-list";

export default async function AdminBookings() {
  const admin = await requireAdmin();
  const rows = await listBookingsForActor(admin, "all");
  return (
    <>
      <PanelTitle title="Solicitudes de contratación" description="Supervisión de todas las solicitudes. El administrador puede cancelar solicitudes abusivas." />
      {rows.length ? <BookingList rows={rows} perspective="admin" /> : <EmptyState icon={Inbox} title="Sin solicitudes" />}
    </>
  );
}
