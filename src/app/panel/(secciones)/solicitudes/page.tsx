import { Inbox } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listBookingsForActor } from "@/server/bookings";
import { PanelTitle } from "@/components/layout/panel-title";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { BookingList } from "@/components/panel/booking-list";

export default async function BookingsPage() {
  const user = await requireUser();
  const [received, sent] = await Promise.all([user.role === "artist" ? listBookingsForActor(user, "received") : Promise.resolve([]), listBookingsForActor(user, "sent")]);
  return (
    <>
      <PanelTitle title="Contrataciones" description="Revisa, negocia y actualiza el estado de cada solicitud." />
      {user.role === "artist" && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">Recibidas</h2>
          {received.length ? <BookingList rows={received} perspective="artist" /> : <EmptyState icon={Inbox} title="Sin solicitudes recibidas" description="Asegúrate de tener el perfil publicado y la contratación activada." />}
        </section>
      )}
      <section>
        <h2 className="mb-3 text-lg font-bold">Enviadas</h2>
        {sent.length ? (
          <BookingList rows={sent} perspective="requester" />
        ) : (
          <EmptyState icon={Inbox} title="No has enviado solicitudes" action={<LinkButton href="/artistas?contratables=1" variant="secondary">Buscar artistas</LinkButton>} />
        )}
      </section>
    </>
  );
}
