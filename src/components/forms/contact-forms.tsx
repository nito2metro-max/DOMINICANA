"use client";
import { Form } from "@/components/ui/action-form";
import { useActionState } from "react";
import { applyAction, leadAction, reportAction, serviceInquiryAction } from "@/app/actions/public";
import { reportReasonLabels } from "@/config/site";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function ServiceInquiryForm({ serviceId, defaultName, defaultEmail, available }: { serviceId: string; defaultName?: string; defaultEmail?: string; available: boolean }) {
  const [state, action] = useActionState(serviceInquiryAction.bind(null, serviceId), undefined);
  const e = state?.errors ?? {};
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <Form state={state} action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Nombre" htmlFor="name" error={e.name}>
        <Input id="name" name="name" defaultValue={defaultName} required autoComplete="name" />
      </Field>
      <Field label="Correo electrónico" htmlFor="email" error={e.email}>
        <Input id="email" name="email" type="email" defaultValue={defaultEmail} required autoComplete="email" />
      </Field>
      <Field label="¿Qué necesitas?" htmlFor="message" error={e.message}>
        <Textarea id="message" name="message" required rows={4} placeholder="Cuéntanos sobre tu proyecto, fechas y objetivos" />
      </Field>
      <SubmitButton className="w-full" pendingText="Enviando…">
        {available ? "Solicitar información" : "Avisarme cuando esté disponible"}
      </SubmitButton>
      <p className="text-xs text-muted">Usaremos tu correo solo para responder a esta solicitud.</p>
    </Form>
  );
}

export function LeadForm() {
  const [state, action] = useActionState(leadAction, undefined);
  const e = state?.errors ?? {};
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <Form state={state} action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Tipo de organización" htmlFor="kind" error={e.kind}>
        <Select id="kind" name="kind" defaultValue="marca">
          <option value="marca">Marca</option>
          <option value="patrocinador">Patrocinador</option>
          <option value="promotor">Promotor / organizador de eventos</option>
          <option value="negocio">Discoteca, restaurante u hotel</option>
          <option value="otro">Otro</option>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="name" error={e.name}>
          <Input id="name" name="name" required autoComplete="name" />
        </Field>
        <Field label="Empresa" htmlFor="company" optional>
          <Input id="company" name="company" autoComplete="organization" />
        </Field>
        <Field label="Correo electrónico" htmlFor="email" error={e.email}>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Teléfono" htmlFor="phone" optional>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        </Field>
      </div>
      <Field label="Mensaje" htmlFor="message" error={e.message}>
        <Textarea id="message" name="message" required rows={4} placeholder="Objetivos, fechas, tipo de artista o campaña…" />
      </Field>
      <SubmitButton pendingText="Enviando…">Enviar mensaje</SubmitButton>
    </Form>
  );
}

export function ReportForm({ targetType, targetId, defaultName, defaultEmail }: { targetType: string; targetId: string; defaultName?: string; defaultEmail?: string }) {
  const [state, action] = useActionState(reportAction, undefined);
  const e = state?.errors ?? {};
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <Form state={state} action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <Field label="Motivo" htmlFor="reason" error={e.reason}>
        <Select id="reason" name="reason" defaultValue="derechos_autor">
          {Object.entries(reportReasonLabels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Descripción"
        htmlFor="details"
        error={e.details}
        hint="Para derechos de autor: identifica la obra protegida, el contenido infractor y tu relación con los derechos."
      >
        <Textarea id="details" name="details" required rows={5} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tu nombre" htmlFor="reporterName" error={e.reporterName}>
          <Input id="reporterName" name="reporterName" defaultValue={defaultName} required />
        </Field>
        <Field label="Tu correo" htmlFor="reporterEmail" error={e.reporterEmail}>
          <Input id="reporterEmail" name="reporterEmail" type="email" defaultValue={defaultEmail} required />
        </Field>
      </div>
      <Checkbox name="isRightsHolder" label="Soy titular de los derechos o actúo en su nombre" />
      <Checkbox name="goodFaith" label="Declaro de buena fe que la información es exacta" description="Las denuncias falsas pueden tener consecuencias legales." />
      {e.goodFaith && <p className="text-sm text-rose-600">{e.goodFaith[0]}</p>}
      <SubmitButton variant="danger" pendingText="Enviando…">
        Enviar denuncia
      </SubmitButton>
    </Form>
  );
}

export function ApplyForm({ opportunityId }: { opportunityId: string }) {
  const [state, action] = useActionState(applyAction.bind(null, opportunityId), undefined);
  const e = state?.errors ?? {};
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <Form state={state} action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Mensaje para los organizadores" htmlFor="message" error={e.message} hint="Preséntate y explica por qué encajas. Tu perfil público se adjunta automáticamente.">
        <Textarea id="message" name="message" required rows={5} />
      </Field>
      <SubmitButton className="w-full" pendingText="Enviando…">
        Enviar postulación
      </SubmitButton>
    </Form>
  );
}
