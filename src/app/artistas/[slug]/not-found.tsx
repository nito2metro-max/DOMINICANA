import { UserX } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page py-20">
      <EmptyState icon={UserX} title="Artista no encontrado" description="Puede que el perfil no exista o que todavía no esté publicado." action={<LinkButton href="/artistas">Explorar artistas</LinkButton>} />
    </div>
  );
}
