import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { param } from "@/lib/utils";
import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (await getCurrentUser()) redirect("/panel");
  const tipo = param((await searchParams).tipo);
  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="El registro es gratuito. Solo pedimos los datos imprescindibles."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/entrar" className="font-semibold text-brand-600">
            Inicia sesión
          </Link>
        </>
      }
    >
      <RegisterForm defaultRole={tipo} />
    </AuthShell>
  );
}
