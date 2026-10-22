"use client";
import { Form } from "@/components/ui/action-form";
import { useActionState } from "react";
import { createBookingAction } from "@/app/actions/public";
import { eventTypeLabels } from "@/config/site";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function BookingForm({ artistId, artistName }: { artistId: string; artistName: string }) {
  const [state, action] = useActionState(createBookingAction.bind(null, artistId), undefined);
  const e = state?.errors ?? {};
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  return (
    <Form state={state} action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tipo de evento" htmlFor="eventType" error={e.eventType}>
          <Select id="eventType" name="eventType" required defaultValue="" invalid={!!e.eventType}>
            <option value="" disabled>
              Selecciona…
            </option>
            {Object.entries(eventTypeLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha del evento" htmlFor="eventDate" error={e.eventDate}>
          <Input id="eventDate" name="eventDate" type="date" min={tomorrow} required invalid={!!e.eventDate} />
        </Field>
      </div>
      <Field label="Ubicación" htmlFor="location" error={e.location} hint="Ciudad, local o dirección aproximada">
        <Input id="location" name="location" required maxLength={160} placeholder="Ej.: Zona Colonial, Santo Domingo" invalid={!!e.location} />
      </Field>
      <Field label="Organización o negocio" htmlFor="organization" optional error={e.organization}>
        <Input id="organization" name="organization" maxLength={120} placeholder="Nombre de tu empresa, local o evento" />
      </Field>
      <fieldset>
        <legend className="text-sm font-semibold">Presupuesto aproximado (DOP)</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          <Field label="Mínimo" htmlFor="budgetMin" error={e.budgetMin} optional>
            <Input id="budgetMin" name="budgetMin" inputMode="numeric" placeholder="20,000" />
          </Field>
          <Field label="Máximo" htmlFor="budgetMax" error={e.budgetMax} optional>
            <Input id="budgetMax" name="budgetMax" inputMode="numeric" placeholder="40,000" />
          </Field>
        </div>
      </fieldset>
      <Field label="Detalles del evento" htmlFor="details" error={e.details} hint="Duración del show, número de asistentes, equipo de sonido disponible, horario…">
        <Textarea id="details" name="details" required minLength={20} maxLength={2000} rows={5} invalid={!!e.details} />
      </Field>
      <p className="text-sm text-muted">
        {artistName} recibirá tu solicitud y podrá responderte desde su panel. Enviar una solicitud <strong>no confirma</strong> la contratación ni genera ningún
        cobro.
      </p>
      <SubmitButton size="lg" className="w-full sm:w-auto" pendingText="Enviando…">
        Enviar solicitud
      </SubmitButton>
    </Form>
  );
}
