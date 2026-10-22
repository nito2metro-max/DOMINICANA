import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Scale } from "lucide-react";
import { getOpportunity } from "@/server/catalog";
import { getCurrentUser } from "@/lib/auth/session";
import { opportunityTypeLabels } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { Badge, DemoBadge, SponsoredBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";
import { ApplyForm } from "@/components/forms/contact-forms";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const o = await getOpportunity((await params).slug);
  return o ? { title: o.title, description: o.summary } : { title: "Oportunidad no encontrada" };
}

export default async function OpportunityPage({ params }: Props) {
  const { slug } = await params;
  const o = await getOpportunity(slug);
  if (!o) notFound();
  const user = await getCurrentUser();
  const closed = !!o.deadline && o.deadline < new Date().toISOString().slice(0, 10);

  return (
    <div className="container-page py-10">
      <Link href="/oportunidades" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Todas las oportunidades
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <article>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="brand">{opportunityTypeLabels[o.type]}</Badge>
            {o.isSponsored && <SponsoredBadge sponsor={o.sponsorName} />}
            {o.isDemo && <DemoBadge />}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{o.title}</h1>
          <p className="mt-2 text-muted">Organiza: {o.organizer}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-2">
            {o.deadline && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-4" /> Cierre: {formatDate(o.deadline)}
              </span>
            )}
            {o.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" /> {o.location}
              </span>
            )}
          </div>
          {o.isSponsored && (
            <Notice tone="warn" className="mt-6">
              Contenido patrocinado por <strong>{o.sponsorName}</strong>. No es una recomendación editorial independiente.
            </Notice>
          )}
          <div className="prose-df mt-6">
            {o.description.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {o.rules && (
            <section className="card mt-6 p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Scale className="size-5 text-brand-600" /> Reglas y criterios de selección
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-2">{o.rules}</p>
            </section>
          )}
        </article>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-lg font-bold">Postúlate</h2>
            <div className="mt-4">
              {closed ? (
                <Notice>El plazo de esta oportunidad ha terminado.</Notice>
              ) : !user ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted">Inicia sesión con tu cuenta de artista para postularte. El registro es gratuito.</p>
                  <LinkButton href={`/entrar?next=/oportunidades/${slug}`} className="w-full">
                    Iniciar sesión
                  </LinkButton>
                  <LinkButton href="/registro?tipo=artist" variant="outline" className="w-full">
                    Crear perfil de artista
                  </LinkButton>
                </div>
              ) : user.role !== "artist" ? (
                <Notice>Solo las cuentas de artista pueden postularse.</Notice>
              ) : (
                <ApplyForm opportunityId={o.id} />
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
