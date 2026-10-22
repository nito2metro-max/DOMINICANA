import type { Metadata } from "next";
import { Disc3 } from "lucide-react";
import { latestReleases } from "@/server/artists";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { ReleaseCard } from "@/components/cards/release-card";

export const metadata: Metadata = { title: "Nuevos lanzamientos" };
export const dynamic = "force-dynamic";

export default async function ReleasesPage() {
  const releases = await latestReleases(48);
  return (
    <>
      <PageHeader
        eyebrow="Música nueva"
        title="Nuevos lanzamientos"
        description="Sencillos, EP y álbumes de artistas de la plataforma. Escúchalos siempre en sus plataformas oficiales."
      />
      <div className="container-page py-10">
        {releases.length === 0 ? (
          <EmptyState icon={Disc3} title="Aún no hay lanzamientos" />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {releases.map((r) => (
              <ReleaseCard key={r.id} release={r} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
