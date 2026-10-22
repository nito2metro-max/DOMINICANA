import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { param } from "@/lib/utils";
import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/components/forms/auth-forms";
import { Notice } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Iniciar sesión", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const next = param((await searchParams).next);
  if (await getCurrentUser()) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/panel");
  return (
    <AuthShell
      title="Bienvenido de nuevo"
      subtitle="Entra para gestionar tu perfil, tus solicitudes y tus artistas guardados."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-brand-600">
            Regístrate gratis
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
      {process.env.NODE_ENV !== "production" && (
        <Notice tone="info" title="Cuentas de demostración (solo desarrollo)" className="mt-5">
          artista@demo.local / DemoArtista2026! · promotor@demo.local / DemoPromotor2026! · admin@demo.local / DemoAdmin2026!
        </Notice>
      )}
    </AuthShell>
  );
}
