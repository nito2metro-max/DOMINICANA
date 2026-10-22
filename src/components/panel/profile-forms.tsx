"use client";
import { Form } from "@/components/ui/action-form";
import { useActionState, useState } from "react";
import { ImageUp } from "lucide-react";
import { requestVerificationAction, saveProfileAction, uploadImageAction } from "@/app/actions/panel";
import { provinces } from "@/config/site";
import type { Artist, Genre } from "@/db/schema";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({ artist, genres }: { artist: Artist; genres: Pick<Genre, "id" | "name">[] }) {
  const [state, action] = useActionState(saveProfileAction, undefined);
  const e = state?.errors ?? {};
  const [shortLen, setShortLen] = useState(artist.shortBio.length);
  return (
    <Form state={state} action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre artístico" htmlFor="stageName" error={e.stageName}>
          <Input id="stageName" name="stageName" defaultValue={artist.stageName} required maxLength={60} />
        </Field>
        <Field label="Género principal" htmlFor="genreId" error={e.genreId}>
          <Select id="genreId" name="genreId" defaultValue={artist.genreId ?? ""} required>
            <option value="" disabled>
              Selecciona…
            </option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Provincia" htmlFor="province" optional>
          <Select id="province" name="province" defaultValue={artist.province ?? ""}>
            <option value="">Sin especificar</option>
            {provinces.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field label="Ciudad o sector" htmlFor="city" optional>
          <Input id="city" name="city" defaultValue={artist.city ?? ""} maxLength={80} />
        </Field>
      </div>
      <Field label="Descripción corta" htmlFor="shortBio" error={e.shortBio} hint={`${shortLen}/160 · Aparece en las tarjetas del catálogo`}>
        <Input id="shortBio" name="shortBio" defaultValue={artist.shortBio} maxLength={160} onChange={(ev) => setShortLen(ev.target.value.length)} />
      </Field>
      <Field label="Biografía" htmlFor="bio" error={e.bio} hint="Tu historia, influencias y logros. Separa párrafos con una línea en blanco.">
        <Textarea id="bio" name="bio" defaultValue={artist.bio} rows={8} maxLength={4000} />
      </Field>
      <div className="space-y-3 rounded-2xl bg-canvas p-4">
        <Checkbox name="bookingEnabled" defaultChecked={artist.bookingEnabled} label="Aceptar solicitudes de contratación" description="Locales y promotores podrán enviarte solicitudes desde tu perfil." />
        <Checkbox name="isPublished" defaultChecked={artist.isPublished} label="Perfil público" description="Si lo desactivas, tu perfil deja de aparecer en el catálogo y solo tú podrás verlo." />
      </div>
      <SubmitButton>Guardar perfil</SubmitButton>
    </Form>
  );
}

export function ImageUploadForm({ field, label, current, aspect }: { field: "avatarUrl" | "coverUrl"; label: string; current: string | null; aspect: string }) {
  const [state, action] = useActionState(uploadImageAction.bind(null, field), undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const src = preview ?? current;
  return (
    <Form state={state} action={action} className="space-y-3">
      <p className="text-sm font-semibold">{label}</p>
      <div className={`overflow-hidden rounded-2xl border border-dashed border-line-strong bg-canvas ${aspect}`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Vista previa: ${label}`} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-muted">
            <ImageUp className="size-8" />
          </div>
        )}
      </div>
      <input
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={label}
        className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-700"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setPreview(f ? URL.createObjectURL(f) : null);
        }}
      />
      <p className="text-xs text-muted">JPG, PNG o WebP, máximo 5 MB. Solo imágenes propias o con autorización.</p>
      <FormMessage state={state} />
      <SubmitButton size="sm" variant="secondary" pendingText="Subiendo…">
        Subir imagen
      </SubmitButton>
    </Form>
  );
}

export function VerificationForm() {
  const [state, action] = useActionState(requestVerificationAction, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <Form state={state} action={action} className="space-y-3">
      <FormMessage state={state} />
      <Field label="Evidencia" htmlFor="evidence" error={state?.errors?.evidence} hint="Enlaces a tus redes oficiales, distribuidora, prensa o contacto de tu representante.">
        <Textarea id="evidence" name="evidence" rows={3} required />
      </Field>
      <SubmitButton size="sm" variant="secondary">
        Solicitar verificación
      </SubmitButton>
    </Form>
  );
}
