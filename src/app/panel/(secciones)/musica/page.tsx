import { ExternalLink, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getOwnArtist, listOwnContent } from "@/server/artists";
import { deleteMediaAction, deleteReleaseAction, removeLinkAction } from "@/app/actions/panel";
import { linkPlatforms, releaseTypeLabels } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { Notice } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { LinkForm, MediaForm, ReleaseForm } from "@/components/panel/music-forms";
import { CoverArt } from "@/components/brand/art";

function DeleteButton({ action, id, label }: { action: (fd: FormData) => Promise<void>; id: string; label: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="grid size-9 place-items-center rounded-full text-muted hover:bg-rose-50 hover:text-rose-600" aria-label={label} title={label}>
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}

export default async function MusicPage() {
  const user = await requireUser(["artist"], "/panel/musica");
  const artist = await getOwnArtist(user);
  if (!artist) return <Notice tone="warn">No se encontró tu perfil de artista.</Notice>;
  const { links, releases, media } = await listOwnContent(user, artist.id);
  const statusTone = { published: "palm", under_review: "warn", removed: "rose" } as const;
  const statusLabel = { published: "Publicado", under_review: "En revisión", removed: "Retirado" } as const;

  return (
    <>
      <PanelTitle title="Música y contenido" description="Lanzamientos, enlaces a plataformas oficiales y contenido multimedia autorizado." />
      <div className="space-y-8">
        <section className="card p-6">
          <h2 className="text-lg font-bold">Canciones y lanzamientos</h2>
          {releases.length > 0 && (
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
              {releases.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg">
                    {r.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <CoverArt seed={r.id} label="" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.title}</p>
                    <p className="text-sm text-muted">
                      {releaseTypeLabels[r.type]}
                      {r.releaseDate && ` · ${formatDate(r.releaseDate)}`}
                    </p>
                  </div>
                  <DeleteButton action={deleteReleaseAction} id={r.id} label={`Eliminar ${r.title}`} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 border-t border-line pt-5">
            <ReleaseForm />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-bold">Enlaces a plataformas</h2>
          {links.length > 0 && (
            <ul className="mt-4 grid gap-2">
              {links.map((l) => (
                <li key={l.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
                  <span className="w-28 shrink-0 text-sm font-semibold">{linkPlatforms.find((p) => p.id === l.platform)?.label ?? l.platform}</span>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm text-brand-600">
                    {l.url}
                  </a>
                  <DeleteButton action={removeLinkAction} id={l.id} label="Eliminar enlace" />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5">
            <LinkForm />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-bold">Videos y contenido multimedia</h2>
          <Notice tone="info" className="mt-3">
            Solo se publican enlaces o reproductores oficiales. Cada publicación registra tu confirmación de derechos. El contenido denunciado puede ser retirado por el
            equipo según el <a href="/legal/derechos" className="font-semibold underline">proceso de retirada</a>.
          </Notice>
          {media.length > 0 && (
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
              {media.map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {m.title} <Badge tone={statusTone[m.status]}>{statusLabel[m.status]}</Badge>
                    </p>
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-sm text-muted">
                      {m.platform} <ExternalLink className="size-3" />
                    </a>
                    {m.removalReason && <p className="text-sm text-rose-600">Motivo: {m.removalReason}</p>}
                  </div>
                  <DeleteButton action={deleteMediaAction} id={m.id} label={`Eliminar ${m.title}`} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 border-t border-line pt-5">
            <MediaForm />
          </div>
        </section>
      </div>
    </>
  );
}
