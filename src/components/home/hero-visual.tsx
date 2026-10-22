import { BadgeCheck, CalendarCheck, Music2 } from "lucide-react";
import { ArtistAvatar, CoverArt } from "@/components/brand/art";
import type { ArtistCardData } from "@/server/artists";

/** Collage ilustrativo del hero construido con artistas de demostración (etiquetados). */
export function HeroVisual({ artists }: { artists: ArtistCardData[] }) {
  const [a, b, c] = artists;
  return (
    <div className="relative mx-auto hidden aspect-[5/4] w-full max-w-xl select-none sm:block" aria-hidden>
      {/* Fondo: sol caribeño y ondas */}
      <svg viewBox="0 0 500 400" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffd9b5" />
            <stop offset="1" stopColor="#ffd9b5" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="380" cy="90" r="120" fill="url(#sun)" />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M0 ${300 + i * 26} C 120 ${260 + i * 26}, 220 ${340 + i * 26}, 330 ${296 + i * 26} S 470 ${270 + i * 26}, 520 ${300 + i * 26}`} fill="none" stroke="#bfd3ff" strokeWidth="3" strokeLinecap="round" opacity={0.9 - i * 0.25} />
        ))}
      </svg>
      {a && (
        <div className="absolute left-[4%] top-[8%] w-[54%] rotate-[-4deg] animate-fade-up overflow-hidden rounded-3xl bg-white shadow-lift">
          <div className="aspect-[4/3]">
            <CoverArt seed={a.slug} color={a.genreColor} label="" />
          </div>
          <div className="flex items-center gap-3 p-3.5">
            <ArtistAvatar name={a.stageName} color={a.genreColor} className="size-10 text-sm" />
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-sm font-bold">
                {a.stageName} <span className="rounded-full bg-amber-50 px-1.5 text-[10px] font-semibold text-amber-800">Demo</span>
              </p>
              <p className="truncate text-xs text-muted">{a.genreName} · {a.city}</p>
            </div>
          </div>
        </div>
      )}
      {b && (
        <div className="absolute right-[2%] top-[22%] w-[44%] rotate-[3deg] animate-fade-up overflow-hidden rounded-3xl bg-white shadow-lift [animation-delay:120ms]">
          <div className="aspect-square">
            <CoverArt seed={b.slug + "x"} color={b.genreColor} label="" />
          </div>
          <div className="p-3">
            <p className="flex items-center gap-1 text-sm font-bold">
              <Music2 className="size-3.5 text-brand-600" /> Nuevo lanzamiento
            </p>
            <p className="truncate text-xs text-muted">{b.stageName} · ejemplo</p>
          </div>
        </div>
      )}
      <div className="absolute bottom-[10%] left-[10%] flex animate-fade-up items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lift [animation-delay:240ms]">
        <span className="grid size-9 place-items-center rounded-xl bg-palm-50 text-palm-600">
          <CalendarCheck className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold">Solicitud de contratación</p>
          <p className="text-xs text-muted">Evento privado · Santiago</p>
        </div>
      </div>
      {c && (
        <div className="absolute bottom-[24%] right-[6%] flex animate-fade-up items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-lift [animation-delay:360ms]">
          <ArtistAvatar name={c.stageName} color={c.genreColor} className="size-8 text-xs" />
          <span className="text-sm font-semibold">{c.genreName}</span>
          <BadgeCheck className="size-4 text-brand-600" />
        </div>
      )}
    </div>
  );
}
