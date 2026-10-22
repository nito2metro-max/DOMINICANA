"use client";
import { Form } from "@/components/ui/action-form";
import { useActionState } from "react";
import { changePasswordAction, deleteAccountAction, updateAccountAction } from "@/app/actions/panel";
import { Checkbox, Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function AccountForm({ name, marketingOptIn }: { name: string; marketingOptIn: boolean }) {
  const [state, action] = useActionState(updateAccountAction, undefined);
  return (
    <Form state={state} action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field label="Nombre" htmlFor="name" error={state?.errors?.name}>
        <Input id="name" name="name" defaultValue={name} required maxLength={80} />
      </Field>
      <Checkbox name="marketingOptIn" defaultChecked={marketingOptIn} label="Recibir novedades y convocatorias por correo" description="Puedes desactivarlo en cualquier momento." />
      <SubmitButton size="sm">Guardar</SubmitButton>
    </Form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, undefined);
  const e = state?.errors ?? {};
  return (
    <Form state={state} action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field label="Contraseña actual" htmlFor="current" error={e.current}>
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="Nueva contraseña" htmlFor="next" error={e.next} hint="Mínimo 10 caracteres con letras y números. Se cerrarán todas tus sesiones.">
        <Input id="next" name="next" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton size="sm" variant="secondary">
        Cambiar contraseña
      </SubmitButton>
    </Form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccountAction, undefined);
  return (
    <Form state={state} action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field label='Escribe "ELIMINAR" para confirmar' htmlFor="confirm">
        <Input id="confirm" name="confirm" autoComplete="off" required />
      </Field>
      <SubmitButton size="sm" variant="danger" pendingText="Eliminando…">
        Eliminar mi cuenta definitivamente
      </SubmitButton>
    </Form>
  );
}
