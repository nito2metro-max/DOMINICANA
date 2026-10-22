import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getArtistProfile } from "@/server/artists";
import { canRequestBooking } from "@/lib/auth/policies";
import { requireUser } from "@/lib/auth/session";
import { ArtistAvatar } from "@/components/brand/art";
import { DemoBadge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/misc";
import { BookingForm } from "@/components/forms/booking-form";

export const metadata: Metadata = { title: "Solicitar contratación", robots: { index: false } };

export default async function BookArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(undefined, `/artistas/${slug}/contratar`);
  const p = await getArtistProfile(slug, user);
  if (!p) notFound();
  const allowed = canRequestBooking(user, p.artist);

  return (
    <div className="container-page max-w-3xl py-10">
      <Link href={`/artistas/${slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Volver al perfil
      </Link>
      <div className="mt-6 flex items-center gap-4">
        <ArtistAvatar name={p.artist.stageName} src={p.artist.avatarUrl} color={p.genre?.color} className="size-16 text-xl" />
        <div>
          <p className="eyebrow">Solicitud de contratación</p>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{p.artist.stageName}</h1>
          {p.artist.isDemo && <DemoBadge className="mt-1" label="Perfil de demostración" />}
        </div>
      </div>

      <ol className="mt-8 grid gap-3 sm:grid-cols-4">
        {["Envías fecha, lugar y presupuesto", "El artista recibe la solicitud", "Revisan detalles y negocian", "Acuerdo firmado entre las partes"].map((t, i) => (
          <li key={t} className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm shadow-card">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>

      <div className="card mt-8 p-6 sm:p-8">
        {allowed ? (
          <BookingForm artistId={p.artist.id} artistName={p.artist.stageName} />
        ) : (
          <Notice tone="warn" title="No es posible enviar la solicitud">
            {p.artist.userId === user.id ? "No puedes enviarte una solicitud a ti mismo." : "Este artista no acepta solicitudes de contratación en este momento."}
          </Notice>
        )}
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs text-muted">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        Tus datos de contacto solo se comparten con el artista cuando la solicitud pasa a negociación. Los pagos y contratos se acuerdan fuera de la plataforma en esta
        versión.
      </p>
    </div>
  );
}
