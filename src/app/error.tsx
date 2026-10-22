"use client";
import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-20">
      <EmptyState icon={TriangleAlert} title="Algo salió mal" description="No pudimos cargar esta página. Inténtalo de nuevo en unos segundos." action={<Button onClick={reset}>Reintentar</Button>} />
    </div>
  );
}
