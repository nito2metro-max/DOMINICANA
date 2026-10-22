import { Eye, Heart, Inbox, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { artistStats, getOwnArtist } from "@/server/artists";
import { PanelTitle } from "@/components/layout/panel-title";
import { Notice, StatCard } from "@/components/ui/misc";
import { bookingStatusLabels } from "@/config/site";

export default async function StatsPage() {
  const user = await requireUser(["artist"], "/panel/estadisticas");
  const artist = await getOwnArtist(user);
  if (!artist) return <Notice tone="warn">No se encontró tu perfil de artista.</Notice>;
  const s = await artistStats(user, artist.id);
  // Serie completa de 30 días (los días sin visitas cuentan 0)
  const byDay = new Map(s.viewsByDay.map((v) => [String(v.day), v.count]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day: d, count: byDay.get(d) ?? 0 };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  const totalBookings = Object.values(s.bookings).reduce<number>((a, b) => a + (b ?? 0), 0);

  return (
    <>
      <PanelTitle title="Estadísticas" description="Datos medidos dentro de esta plataforma. No incluyen reproducciones de servicios externos." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Seguidores en la plataforma" value={s.followers} icon={Heart} />
        <StatCard label="Visitas al perfil (30 días)" value={s.views30} icon={Eye} />
        <StatCard label="Solicitudes recibidas" value={totalBookings} icon={Inbox} />
        <StatCard label="Solicitudes aceptadas" value={s.bookings.accepted ?? 0} icon={CheckCircle2} />
      </div>
      <section className="card mt-6 p-6">
        <h2 className="font-bold">Visitas al perfil — últimos 30 días</h2>
        {s.views30 === 0 ? (
          <p className="mt-4 text-sm text-muted">Todavía no hay visitas registradas. Comparte el enlace de tu perfil para empezar a medir.</p>
        ) : (
          <div className="mt-6 flex h-40 items-end gap-[3px]" role="img" aria-label={`Gráfico de visitas diarias; total ${s.views30}`}>
            {days.map((d) => (
              <div key={d.day} className="group relative flex-1">
                <div className="w-full rounded-t bg-brand-500/80 transition group-hover:bg-brand-600" style={{ height: `${Math.max(2, (d.count / max) * 150)}px` }} />
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[11px] text-white group-hover:block">
                  {d.day.slice(5)}: {d.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="card mt-6 p-6">
        <h2 className="font-bold">Solicitudes por estado</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(bookingStatusLabels).map(([k, l]) => (
            <div key={k} className="rounded-xl bg-canvas p-3">
              <dt className="text-xs text-muted">{l}</dt>
              <dd className="text-xl font-extrabold">{s.bookings[k] ?? 0}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
