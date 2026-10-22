import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { param } from "@/lib/utils";
import { PageHeader, Notice } from "@/components/ui/misc";
import { ReportForm } from "@/components/forms/contact-forms";

export const metadata: Metadata = { title: "Reportar contenido", robots: { index: false } };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function ReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tipo = param(sp.tipo);
  const id = param(sp.id);
  const user = await getCurrentUser();
  const valid = !!tipo && ["artist", "media", "release", "post"].includes(tipo) && !!id && UUID.test(id);
  return (
    <>
      <PageHeader
        eyebrow="Confianza y seguridad"
        title="Reportar contenido"
        description={
          <>
            Usa este formulario para denunciar infracciones de derechos de autor, suplantación o contenido inapropiado. Consulta el{" "}
            <Link href="/legal/derechos" className="font-semibold text-brand-600">
              proceso de retirada
            </Link>
            .
          </>
        }
      />
      <div className="container-page max-w-2xl py-10">
        <div className="card p-6 sm:p-8">
          {valid ? (
            <ReportForm targetType={tipo!} targetId={id!} defaultName={user?.name} defaultEmail={user?.email} />
          ) : (
            <Notice tone="info">
              Para reportar, usa el enlace «Reportar» que aparece en el perfil o contenido concreto. Si no lo encuentras, escríbenos indicando la URL del contenido.
            </Notice>
          )}
        </div>
      </div>
    </>
  );
}
