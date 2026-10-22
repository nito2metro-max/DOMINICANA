import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listFollowed } from "@/server/artists";
import { PanelTitle } from "@/components/layout/panel-title";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { ArtistCard } from "@/components/cards/artist-card";

export default async function SavedPage() {
  const user = await requireUser();
  const items = await listFollowed(user);
  return (
    <>
      <PanelTitle title="Artistas guardados" description="Los artistas que sigues. Usamos esta lista para tus recomendaciones." />
      {items.length === 0 ? (
        <EmptyState icon={Heart} title="Aún no sigues a ningún artista" action={<LinkButton href="/artistas">Descubrir artistas</LinkButton>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </div>
      )}
    </>
  );
}
