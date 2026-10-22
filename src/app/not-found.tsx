import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page py-20">
      <EmptyState icon={Compass} title="Página no encontrada" description="El enlace puede estar roto o la página ya no existe." action={<LinkButton href="/">Volver al inicio</LinkButton>} />
    </div>
  );
}
