import type { ReactNode } from "react";
import { PageHeader, Notice } from "@/components/ui/misc";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageHeader eyebrow="Legal" title={title} description={`Última actualización: ${updated}`} />
      <div className="container-page max-w-3xl py-10">
        <Notice tone="warn" title="Borrador pendiente de revisión jurídica" className="mb-8">
          Este texto es un borrador de trabajo. Debe ser revisado por un abogado en República Dominicana (incluida la Ley 172-13 de protección de datos y la Ley 65-00
          sobre Derecho de Autor) antes del lanzamiento público.
        </Notice>
        <div className="prose-df card p-6 sm:p-10">{children}</div>
      </div>
    </>
  );
}
