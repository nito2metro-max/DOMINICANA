import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Wallet, Building2, Mail, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getBookingDetail } from "@/server/bookings";
import { AppError } from "@/server/errors";
import { eventTypeLabels, bookingStatusLabels, roleLabels } from "@/config/site";
import { cn, formatDate, formatDateTime, formatMoney, param } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { Notice } from "@/components/ui/misc";
import { BookingMessageForm, BookingStatusForm } from "@/components/panel/booking-actions";
import { isBookingOpen } from "@/lib/auth/policies";

export default async function BookingDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sent = param((await searchParams).enviada) === "1";
  const user = await requireUser(undefined, `/panel/solicitudes/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  let d;
  try {
    d = await getBookingDetail(user, id);
  } catch (e) {
    if (e instanceof AppError && e.code === "not_found") notFound();
    throw e;
  }
  const { booking: b } = d;
  const backHref = d.party === "admin" ? "/admin/solicitudes" : "/panel/solicitudes";

  return (
    <>
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Volver
      </Link>
      <PanelTitle
        title={d.party === "artist" ? `Solicitud de ${b.organization || d.requester.name}` : `Solicitud a ${d.artist.stageName}`}
        description={<span className="inline-flex items-center gap-2">Estado actual: <BookingStatusBadge status={b.status} /></span>}
      />
      {sent && (
        <Notice tone="success" className="mb-6">
          ¡Solicitud enviada! {d.artist.stageName} la verá en su panel. Recibirás las respuestas aquí.
        </Notice>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-bold">Detalles del evento</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail icon={Building2} label="Tipo">{eventTypeLabels[b.eventType]}{b.organization ? ` · ${b.organization}` : ""}</Detail>
              <Detail icon={CalendarDays} label="Fecha">{formatDate(b.eventDate, { weekday: "long" })}</Detail>
              <Detail icon={MapPin} label="Ubicación">{b.location}</Detail>
              <Detail icon={Wallet} label="Presupuesto aproximado">
                {b.budgetMin || b.budgetMax ? `${b.budgetMin ? formatMoney(b.budgetMin, b.currency) : "—"} – ${b.budgetMax ? formatMoney(b.budgetMax, b.currency) : "—"}` : "No indicado"}
              </Detail>
            </dl>
            <p className="mt-5 whitespace-pre-line rounded-xl bg-canvas p-4 text-sm leading-relaxed text-ink-2">{b.details}</p>
          </section>

          <section className="card p-6">
            <h2 className="font-bold">Conversación e historial</h2>
            <ol className="mt-4 space-y-3">
              {d.messages.map((m) => (
                <li key={m.id} className={cn("rounded-xl p-3 text-sm", m.statusChange ? "border border-dashed border-line-strong bg-white" : m.authorId === user.id ? "ml-6 bg-brand-50" : "mr-6 bg-canvas")}>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="font-semibold text-ink">{m.authorName ?? "Usuario"}</span> · {formatDateTime(m.createdAt)}
                    {m.statusChange && <span>· cambió el estado a <strong>{bookingStatusLabels[m.statusChange]}</strong></span>}
                  </p>
                  <p className="mt-1 whitespace-pre-line">{m.body}</p>
                </li>
              ))}
              {d.messages.length === 0 && <li className="text-sm text-muted">Sin mensajes todavía.</li>}
            </ol>
            {isBookingOpen(b.status) ? (
              <div className="mt-5 border-t border-line pt-5">
                <BookingMessageForm bookingId={b.id} />
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted">La solicitud está cerrada; no se pueden enviar más mensajes.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="font-bold">Acciones</h2>
            <div className="mt-4">
              <BookingStatusForm bookingId={b.id} allowed={d.allowed} />
            </div>
          </section>
          <section className="card p-6 text-sm">
            <h2 className="font-bold">Partes</h2>
            <p className="mt-3">
              <span className="text-muted">Artista:</span>{" "}
              <Link href={`/artistas/${d.artist.slug}`} className="font-semibold text-brand-600">
                {d.artist.stageName}
              </Link>
            </p>
            <p className="mt-1">
              <span className="text-muted">Solicitante:</span> <span className="font-semibold">{d.requester.name}</span> ({roleLabels[d.requester.role]})
            </p>
            {d.requester.email ? (
              <p className="mt-1 inline-flex items-center gap-1">
                <Mail className="size-3.5 text-muted" /> {d.requester.email}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">El correo del solicitante se mostrará al pasar la solicitud a negociación.</p>
            )}
          </section>
          <Notice tone="warn">
            <span className="flex gap-2">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              «Aceptada» no es una reserva confirmada ni implica pagos. Formalicen el acuerdo con un contrato por escrito.
            </span>
          </Notice>
        </aside>
      </div>
    </>
  );
}

function Detail({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-muted" />
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
        <dd className="mt-0.5 font-medium">{children}</dd>
      </div>
    </div>
  );
}
