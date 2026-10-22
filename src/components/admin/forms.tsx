"use client";
import { Form } from "@/components/ui/action-form";
import { useActionState } from "react";
import {
  addFeatureAction,
  resolveReportAction,
  saveEventAction,
  saveOpportunityAction,
  savePostAction,
  saveProviderAction,
  saveServiceAction,
} from "@/app/actions/admin";
import { opportunityTypeLabels, postKindLabels } from "@/config/site";
import type { Event, Opportunity, Post, Provider, Service } from "@/db/schema";
import { serviceIconNames } from "@/components/cards/service-icon";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

const statusOptions = (
  <>
    <option value="draft">Borrador</option>
    <option value="published">Publicado</option>
    <option value="archived">Archivado</option>
  </>
);

function SponsorFields({ isSponsored, sponsorName, error }: { isSponsored?: boolean; sponsorName?: string | null; error?: string[] }) {
  return (
    <div className="space-y-3 rounded-2xl bg-sun-50/60 p-4">
      <Checkbox name="isSponsored" defaultChecked={isSponsored} label="Contenido patrocinado" description="Se mostrará siempre con la etiqueta «Patrocinado» y el nombre del patrocinador." />
      <Field label="Patrocinador" htmlFor="sponsorName" error={error} optional>
        <Input id="sponsorName" name="sponsorName" defaultValue={sponsorName ?? ""} maxLength={100} />
      </Field>
    </div>
  );
}

export function ServiceForm({ service, providers }: { service?: Service; providers: Provider[] }) {
  const [state, action] = useActionState(saveServiceAction.bind(null, service?.id ?? null), undefined);
  const e = state?.errors ?? {};
  return (
    <Form state={state} action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" htmlFor="title" error={e.title}>
          <Input id="title" name="title" defaultValue={service?.title} required />
        </Field>
        <Field label="Categoría" htmlFor="category" error={e.category}>
          <Input id="category" name="category" defaultValue={service?.category} required placeholder="Diseño, Promoción…" />
        </Field>
      </div>
      <Field label="Resumen" htmlFor="summary" error={e.summary}>
        <Input id="summary" name="summary" defaultValue={service?.summary} required maxLength={200} />
      </Field>
      <Field label="Descripción" htmlFor="description" error={e.description}>
        <Textarea id="description" name="description" defaultValue={service?.description} rows={5} />
      </Field>
      <Field label="Entregables (uno por línea)" htmlFor="deliverables" error={e.deliverables}>
        <Textarea id="deliverables" name="deliverables" defaultValue={service?.deliverables.join("\n")} rows={4} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Precio desde" htmlFor="priceFrom" optional error={e.priceFrom} hint="Vacío = a consultar">
          <Input id="priceFrom" name="priceFrom" inputMode="numeric" defaultValue={service?.priceFrom ?? ""} />
        </Field>
        <Field label="Moneda" htmlFor="currency">
          <Select id="currency" name="currency" defaultValue={service?.currency ?? "DOP"}>
            <option>DOP</option>
            <option>USD</option>
          </Select>
        </Field>
        <Field label="Icono" htmlFor="icon">
          <Select id="icon" name="icon" defaultValue={service?.icon ?? "sparkles"}>
            {serviceIconNames.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Checkbox name="priceIsDemo" defaultChecked={service?.priceIsDemo ?? true} label="El precio es de demostración" description="Desmárcalo solo cuando sea un precio real acordado con el proveedor." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Proveedor" htmlFor="providerId" error={e.providerId}>
          <Select id="providerId" name="providerId" defaultValue={service?.providerId ?? ""}>
            <option value="">Sin proveedor</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.isActive ? "" : " (inactivo)"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado" htmlFor="status" error={e.status} hint="«Activo» exige proveedor asignado">
          <Select id="status" name="status" defaultValue={service?.status ?? "coming_soon"}>
            <option value="active">Activo</option>
            <option value="coming_soon">Próximamente</option>
            <option value="hidden">Oculto</option>
          </Select>
        </Field>
        <Field label="Orden" htmlFor="sortOrder">
          <Input id="sortOrder" name="sortOrder" inputMode="numeric" defaultValue={service?.sortOrder ?? 0} />
        </Field>
      </div>
      <SubmitButton>Guardar servicio</SubmitButton>
    </Form>
  );
}

export function ProviderForm({ provider }: { provider?: Provider }) {
  const [state, action] = useActionState(saveProviderAction.bind(null, provider?.id ?? null), undefined);
  const e = state?.errors ?? {};
  return (
    <Form state={state} action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor={`name-${provider?.id ?? "new"}`} error={e.name}>
          <Input id={`name-${provider?.id ?? "new"}`} name="name" defaultValue={provider?.name} required />
        </Field>
        <Field label="Correo de contacto" htmlFor={`email-${provider?.id ?? "new"}`} error={e.contactEmail} optional>
          <Input id={`email-${provider?.id ?? "new"}`} name="contactEmail" type="email" defaultValue={provider?.contactEmail ?? ""} />
        </Field>
      </div>
      <Field label="Sitio web" htmlFor={`web-${provider?.id ?? "new"}`} error={e.website} optional>
        <Input id={`web-${provider?.id ?? "new"}`} name="website" defaultValue={provider?.website ?? ""} placeholder="https://" />
      </Field>
      <Field label="Descripción" htmlFor={`desc-${provider?.id ?? "new"}`} optional>
        <Textarea id={`desc-${provider?.id ?? "new"}`} name="description" defaultValue={provider?.description} rows={2} />
      </Field>
      <Checkbox name="isActive" defaultChecked={provider?.isActive ?? true} label="Proveedor activo" />
      <SubmitButton size="sm">{provider ? "Guardar cambios" : "Crear proveedor"}</SubmitButton>
    </Form>
  );
}

export function OpportunityForm({ o }: { o?: Opportunity }) {
  const [state, action] = useActionState(saveOpportunityAction.bind(null, o?.id ?? null), undefined);
  const e = state?.errors ?? {};
  return (
    <Form state={state} action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" htmlFor="title" error={e.title}>
          <Input id="title" name="title" defaultValue={o?.title} required />
        </Field>
        <Field label="Tipo" htmlFor="type">
          <Select id="type" name="type" defaultValue={o?.type ?? "convocatoria"}>
            {Object.entries(opportunityTypeLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Organizador" htmlFor="organizer" error={e.organizer}>
          <Input id="organizer" name="organizer" defaultValue={o?.organizer} required />
        </Field>
        <Field label="Ubicación" htmlFor="location" optional>
          <Input id="location" name="location" defaultValue={o?.location ?? ""} />
        </Field>
        <Field label="Fecha de cierre" htmlFor="deadline" optional error={e.deadline}>
          <Input id="deadline" name="deadline" type="date" defaultValue={o?.deadline ?? ""} />
        </Field>
        <Field label="Estado" htmlFor="status">
          <Select id="status" name="status" defaultValue={o?.status ?? "draft"}>
            {statusOptions}
          </Select>
        </Field>
      </div>
      <Field label="Resumen" htmlFor="summary" error={e.summary}>
        <Input id="summary" name="summary" defaultValue={o?.summary} required maxLength={240} />
      </Field>
      <Field label="Descripción" htmlFor="description" error={e.description}>
        <Textarea id="description" name="description" defaultValue={o?.description} rows={6} />
      </Field>
      <Field label="Reglas y criterios de selección" htmlFor="rules" error={e.rules} hint="Obligatorio para concursos: criterios, jurado, plazos y premios.">
        <Textarea id="rules" name="rules" defaultValue={o?.rules} rows={5} />
      </Field>
      <SponsorFields isSponsored={o?.isSponsored} sponsorName={o?.sponsorName} error={e.sponsorName} />
      <SubmitButton>Guardar oportunidad</SubmitButton>
    </Form>
  );
}

const toLocalInput = (d?: Date) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function EventForm({ ev }: { ev?: Event }) {
  const [state, action] = useActionState(saveEventAction.bind(null, ev?.id ?? null), undefined);
  const e = state?.errors ?? {};
  return (
    <Form state={state} action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" htmlFor="title" error={e.title}>
          <Input id="title" name="title" defaultValue={ev?.title} required />
        </Field>
        <Field label="Tipo" htmlFor="kind" error={e.kind}>
          <Input id="kind" name="kind" defaultValue={ev?.kind ?? "Showcase"} required />
        </Field>
        <Field label="Fecha y hora" htmlFor="startsAt" error={e.startsAt}>
          <Input id="startsAt" name="startsAt" type="datetime-local" defaultValue={toLocalInput(ev?.startsAt)} required />
        </Field>
        <Field label="Estado" htmlFor="status">
          <Select id="status" name="status" defaultValue={ev?.status ?? "draft"}>
            {statusOptions}
          </Select>
        </Field>
        <Field label="Lugar" htmlFor="venue" error={e.venue}>
          <Input id="venue" name="venue" defaultValue={ev?.venue} required />
        </Field>
        <Field label="Ciudad" htmlFor="city" error={e.city}>
          <Input id="city" name="city" defaultValue={ev?.city} required />
        </Field>
      </div>
      <Field label="Descripción" htmlFor="description" error={e.description}>
        <Textarea id="description" name="description" defaultValue={ev?.description} rows={4} />
      </Field>
      <Field label="Enlace de entradas o información" htmlFor="ticketUrl" optional error={e.ticketUrl}>
        <Input id="ticketUrl" name="ticketUrl" defaultValue={ev?.ticketUrl ?? ""} placeholder="https://" />
      </Field>
      <SponsorFields isSponsored={ev?.isSponsored} sponsorName={ev?.sponsorName} error={e.sponsorName} />
      <SubmitButton>Guardar evento</SubmitButton>
    </Form>
  );
}

export function PostForm({ post, artists }: { post?: Post; artists: { id: string; stageName: string }[] }) {
  const [state, action] = useActionState(savePostAction.bind(null, post?.id ?? null), undefined);
  const e = state?.errors ?? {};
  return (
    <Form state={state} action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Título" htmlFor="title" error={e.title} className="sm:col-span-3">
          <Input id="title" name="title" defaultValue={post?.title} required />
        </Field>
        <Field label="Tipo" htmlFor="kind">
          <Select id="kind" name="kind" defaultValue={post?.kind ?? "noticia"}>
            {Object.entries(postKindLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Artista relacionado" htmlFor="artistId" optional>
          <Select id="artistId" name="artistId" defaultValue={post?.artistId ?? ""}>
            <option value="">Ninguno</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.stageName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado" htmlFor="status">
          <Select id="status" name="status" defaultValue={post?.status ?? "draft"}>
            {statusOptions}
          </Select>
        </Field>
      </div>
      <Field label="Extracto" htmlFor="excerpt" error={e.excerpt}>
        <Input id="excerpt" name="excerpt" defaultValue={post?.excerpt} required maxLength={300} />
      </Field>
      <Field label="Contenido" htmlFor="body" error={e.body} hint="Separa párrafos con una línea en blanco.">
        <Textarea id="body" name="body" defaultValue={post?.body} rows={12} />
      </Field>
      <SponsorFields isSponsored={post?.isSponsored} sponsorName={post?.sponsorName} error={e.sponsorName} />
      <SubmitButton>Guardar artículo</SubmitButton>
    </Form>
  );
}

export function FeatureForm({ artists }: { artists: { id: string; stageName: string }[] }) {
  const [state, action] = useActionState(addFeatureAction, undefined);
  const e = state?.errors ?? {};
  return (
    <Form state={state} action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Artista (solo publicados)" htmlFor="artistId" error={e.artistId}>
          <Select id="artistId" name="artistId" defaultValue="">
            <option value="" disabled>
              Selecciona…
            </option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.stageName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ubicación" htmlFor="placement">
          <Select id="placement" name="placement">
            <option value="home_destacados">Destacados de la portada</option>
            <option value="talento_semana">Talento de la semana</option>
          </Select>
        </Field>
        <Field label="Tipo" htmlFor="kind" hint="Lo patrocinado se etiqueta siempre como tal">
          <Select id="kind" name="kind">
            <option value="editorial">Selección editorial (no pagada)</option>
            <option value="patrocinado">Espacio patrocinado</option>
          </Select>
        </Field>
        <Field label="Patrocinador" htmlFor="sponsorName" optional error={e.sponsorName}>
          <Input id="sponsorName" name="sponsorName" />
        </Field>
        <Field label="Motivo / criterio" htmlFor="reason" error={e.reason}>
          <Input id="reason" name="reason" required />
        </Field>
        <Field label="Termina el" htmlFor="endsAt" optional>
          <Input id="endsAt" name="endsAt" type="date" />
        </Field>
      </div>
      <SubmitButton size="sm">Crear destacado</SubmitButton>
    </Form>
  );
}

export function ReportResolveForm({ id, targetType }: { id: string; targetType: string }) {
  const [state, action] = useActionState(resolveReportAction.bind(null, id), undefined);
  return (
    <Form state={state} action={action} className="space-y-3">
      <FormMessage state={state} />
      <Textarea name="resolution" rows={2} placeholder="Resolución / notas internas" aria-label="Resolución" />
      <Checkbox
        name="takedown"
        label="Retirar el contenido denunciado"
        description={targetType === "artist" ? "Despublica el perfil" : targetType === "media" ? "Marca el contenido como retirado" : targetType === "release" ? "Elimina el lanzamiento" : "Archiva el artículo"}
      />
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="status" value="reviewing" size="sm" variant="outline">
          En revisión
        </SubmitButton>
        <SubmitButton name="status" value="actioned" size="sm" variant="danger">
          Resolver: procede
        </SubmitButton>
        <SubmitButton name="status" value="dismissed" size="sm" variant="secondary">
          Desestimar
        </SubmitButton>
      </div>
    </Form>
  );
}
