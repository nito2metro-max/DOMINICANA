"use client";
import { Form } from "@/components/ui/action-form";
import { useActionState, useEffect, useRef } from "react";
import { bookingMessageAction, bookingStatusAction } from "@/app/actions/panel";
import type { BookingStatus } from "@/db/schema";
import { FormMessage, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

const verb: Record<BookingStatus, string> = {
  pending: "Marcar pendiente",
  negotiating: "Pasar a negociación",
  accepted: "Aceptar",
  rejected: "Rechazar",
  cancelled: "Cancelar solicitud",
};

export function BookingStatusForm({ bookingId, allowed }: { bookingId: string; allowed: BookingStatus[] }) {
  const [state, action] = useActionState(bookingStatusAction.bind(null, bookingId), undefined);
  if (!allowed.length) return <p className="text-sm text-muted">No hay acciones disponibles para ti en este estado.</p>;
  return (
    <Form
      state={state}
      action={action}
      className="space-y-3"
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const v = submitter?.value as BookingStatus | undefined;
        if ((v === "rejected" || v === "cancelled") && !confirm(`¿Seguro que quieres ${verb[v].toLowerCase()}? Esta acción no se puede deshacer.`)) e.preventDefault();
      }}
    >
      <FormMessage state={state} />
      <Textarea name="note" rows={2} placeholder="Nota opcional para la otra parte" maxLength={1000} aria-label="Nota opcional" />
      <div className="flex flex-wrap gap-2">
        {allowed.map((s) => (
          <SubmitButton key={s} name="status" value={s} size="sm" variant={s === "accepted" ? "primary" : s === "negotiating" ? "secondary" : "outline"} pendingText="…">
            {verb[s]}
          </SubmitButton>
        ))}
      </div>
    </Form>
  );
}

export function BookingMessageForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(bookingMessageAction.bind(null, bookingId), undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <Form state={state} ref={ref} action={action} className="space-y-2">
      {state && !state.ok && <FormMessage state={{ ok: false, message: state.errors?.body?.[0] ?? state.message }} />}
      <Textarea name="body" rows={3} placeholder="Escribe un mensaje…" required maxLength={2000} aria-label="Mensaje" />
      <SubmitButton size="sm" pendingText="Enviando…">
        Enviar mensaje
      </SubmitButton>
    </Form>
  );
}
