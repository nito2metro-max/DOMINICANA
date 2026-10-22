"use client";
import { Form } from "@/components/ui/action-form";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Briefcase, Headphones, Mic2, Wrench } from "lucide-react";
import { loginAction, registerAction } from "@/app/actions/auth";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  const e = state?.errors ?? {};
  return (
    <Form state={state} action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Correo electrónico" htmlFor="email" error={e.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={!!e.email} />
      </Field>
      <Field label="Contraseña" htmlFor="password" error={e.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required invalid={!!e.password} />
      </Field>
      <SubmitButton size="lg" className="w-full" pendingText="Entrando…">
        Iniciar sesión
      </SubmitButton>
    </Form>
  );
}

const roles = [
  { id: "artist", label: "Artista", desc: "Crea tu perfil y recibe oportunidades", icon: Mic2 },
  { id: "fan", label: "Fan", desc: "Sigue y descubre artistas", icon: Headphones },
  { id: "promoter", label: "Promotor o negocio", desc: "Contrata talento para eventos", icon: Briefcase },
  { id: "provider", label: "Profesional", desc: "Ofrece servicios a artistas", icon: Wrench },
] as const;

export function RegisterForm({ defaultRole }: { defaultRole?: string }) {
  const [state, action] = useActionState(registerAction, undefined);
  const [role, setRole] = useState(roles.some((r) => r.id === defaultRole) ? defaultRole! : "artist");
  const e = state?.errors ?? {};
  return (
    <Form state={state} action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <fieldset>
        <legend className="text-sm font-semibold">¿Cómo usarás la plataforma?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {roles.map((r) => (
            <label
              key={r.id}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition",
                role === r.id ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-line hover:border-line-strong",
              )}
            >
              <input type="radio" name="role" value={r.id} checked={role === r.id} onChange={() => setRole(r.id)} className="sr-only" />
              <r.icon className={cn("size-5", role === r.id ? "text-brand-600" : "text-muted")} aria-hidden />
              <span className="text-sm font-bold">{r.label}</span>
              <span className="text-xs leading-snug text-muted">{r.desc}</span>
            </label>
          ))}
        </div>
        {e.role && <p className="mt-1 text-sm text-rose-600">{e.role[0]}</p>}
      </fieldset>
      <Field label={role === "artist" ? "Nombre artístico" : "Nombre"} htmlFor="name" error={e.name}>
        <Input id="name" name="name" autoComplete="name" required maxLength={80} invalid={!!e.name} />
      </Field>
      <Field label="Correo electrónico" htmlFor="email" error={e.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={!!e.email} />
      </Field>
      <Field label="Contraseña" htmlFor="password" error={e.password} hint="Mínimo 10 caracteres, con letras y números">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} invalid={!!e.password} />
      </Field>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="acceptTerms" className="mt-0.5 size-5 shrink-0 accent-brand-600" />
        <span>
          Acepto los{" "}
          <Link href="/legal/terminos" target="_blank" className="font-semibold text-brand-600">
            términos de uso
          </Link>{" "}
          y la{" "}
          <Link href="/legal/privacidad" target="_blank" className="font-semibold text-brand-600">
            política de privacidad
          </Link>
          .
        </span>
      </label>
      {e.acceptTerms && <p className="-mt-3 text-sm text-rose-600">{e.acceptTerms[0]}</p>}
      <SubmitButton size="lg" className="w-full" pendingText="Creando cuenta…">
        Crear cuenta gratis
      </SubmitButton>
    </Form>
  );
}
