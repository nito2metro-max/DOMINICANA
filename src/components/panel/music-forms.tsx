"use client";
import { Form } from "@/components/ui/action-form";
import { useActionState, useEffect, useRef } from "react";
import { addLinkAction, addMediaAction, addReleaseAction } from "@/app/actions/panel";
import { linkPlatforms, releaseTypeLabels } from "@/config/site";
import type { ActionState } from "@/lib/validation";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

function useResetOnSuccess(state: ActionState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return ref;
}

export function ReleaseForm() {
  const [state, action] = useActionState(addReleaseAction, undefined);
  const ref = useResetOnSuccess(state);
  const e = state?.errors ?? {};
  return (
    <Form state={state} ref={ref} action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" htmlFor="title" error={e.title}>
          <Input id="title" name="title" required maxLength={120} />
        </Field>
        <Field label="Tipo" htmlFor="type">
          <Select id="type" name="type" defaultValue="single">
            {Object.entries(releaseTypeLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha de lanzamiento" htmlFor="releaseDate" optional error={e.releaseDate}>
          <Input id="releaseDate" name="releaseDate" type="date" />
        </Field>
        <Field label="Enlace oficial para escuchar" htmlFor="listenUrl" optional error={e.listenUrl}>
          <Input id="listenUrl" name="listenUrl" type="url" placeholder="https://open.spotify.com/…" />
        </Field>
      </div>
      <Field label="Descripción" htmlFor="description" optional>
        <Textarea id="description" name="description" rows={2} maxLength={1000} />
      </Field>
      <Field label="Portada" htmlFor="cover" optional error={e.cover} hint="JPG, PNG o WebP, máx. 5 MB">
        <input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-700" />
      </Field>
      <SubmitButton size="sm">Añadir lanzamiento</SubmitButton>
    </Form>
  );
}

export function LinkForm() {
  const [state, action] = useActionState(addLinkAction, undefined);
  const ref = useResetOnSuccess(state);
  return (
    <Form state={state} ref={ref} action={action} className="space-y-3" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
        <Field label="Plataforma" htmlFor="platform">
          <Select id="platform" name="platform">
            {linkPlatforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="URL" htmlFor="url" error={state?.errors?.url}>
          <Input id="url" name="url" type="url" placeholder="https://" required />
        </Field>
        <SubmitButton size="md" variant="secondary">
          Añadir
        </SubmitButton>
      </div>
    </Form>
  );
}

export function MediaForm() {
  const [state, action] = useActionState(addMediaAction, undefined);
  const ref = useResetOnSuccess(state);
  const e = state?.errors ?? {};
  return (
    <Form state={state} ref={ref} action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" htmlFor="m-title" error={e.title}>
          <Input id="m-title" name="title" required maxLength={120} />
        </Field>
        <Field label="Plataforma" htmlFor="m-platform">
          <Select id="m-platform" name="platform" defaultValue="youtube">
            <option value="youtube">YouTube (video oficial)</option>
            <option value="spotify">Spotify</option>
            <option value="soundcloud">SoundCloud</option>
            <option value="audiomack">Audiomack</option>
            <option value="apple_music">Apple Music</option>
            <option value="other">Otra (requiere revisión)</option>
          </Select>
        </Field>
      </div>
      <Field label="Enlace" htmlFor="m-url" error={e.url} hint="Pega el enlace público oficial. No subimos ni alojamos archivos de audio o video.">
        <Input id="m-url" name="url" type="url" required placeholder="https://www.youtube.com/watch?v=…" />
      </Field>
      <Checkbox
        name="rightsConfirmed"
        label="Confirmo que tengo los derechos o la autorización para publicar este contenido"
        description="Incluye la música, la letra, las imágenes y cualquier muestra (sample). El contenido infractor puede ser retirado."
      />
      {e.rightsConfirmed && <p className="text-sm text-rose-600">{e.rightsConfirmed[0]}</p>}
      <SubmitButton size="sm">Publicar contenido</SubmitButton>
    </Form>
  );
}
