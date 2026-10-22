import { BadgeCheck, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getOwnArtist, listGenres } from "@/server/artists";
import { param } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { Notice } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { ImageUploadForm, ProfileForm, VerificationForm } from "@/components/panel/profile-forms";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser(["artist"], "/panel/perfil");
  const [artist, genres] = await Promise.all([getOwnArtist(user), listGenres()]);
  if (!artist) return <Notice tone="warn">No se encontró tu perfil de artista.</Notice>;
  const welcome = param((await searchParams).bienvenida) === "1";
  return (
    <>
      <PanelTitle
        title="Mi perfil de artista"
        description="Esta información aparece en tu página pública."
        actions={<LinkButton href={`/artistas/${artist.slug}`} variant="outline" size="sm">{artist.isPublished ? "Ver perfil público" : "Vista previa"}</LinkButton>}
      />
      {welcome && (
        <Notice tone="success" className="mb-6" title="¡Bienvenido a la plataforma!">
          Completa tu perfil, elige tu género y márcalo como público para aparecer en el catálogo. El registro es y seguirá siendo gratuito.
        </Notice>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <ProfileForm artist={artist} genres={genres} />
        </section>
        <div className="space-y-6">
          <section className="card space-y-6 p-6">
            <ImageUploadForm field="avatarUrl" label="Foto de perfil" current={artist.avatarUrl} aspect="aspect-square w-40" />
            <ImageUploadForm field="coverUrl" label="Imagen de portada" current={artist.coverUrl} aspect="aspect-[16/7]" />
          </section>
          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-bold">
              <BadgeCheck className="size-5 text-brand-600" /> Verificación
            </h2>
            <div className="mt-3 text-sm">
              {artist.verification === "verified" ? (
                <p className="text-palm-700">Tu perfil está verificado.</p>
              ) : artist.verification === "pending" ? (
                <p className="flex items-center gap-1 text-muted">
                  <Clock className="size-4" /> Solicitud en revisión por el equipo.
                </p>
              ) : (
                <>
                  <p className="mb-3 text-muted">
                    La verificación confirma que la cuenta pertenece al artista. La revisa una persona del equipo; no se compra.
                    {artist.verification === "rejected" && " Tu solicitud anterior fue rechazada; puedes enviar nueva evidencia."}
                  </p>
                  {artist.isPublished ? <VerificationForm /> : <p className="text-muted">Publica tu perfil para poder solicitarla.</p>}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
