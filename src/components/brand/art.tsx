/**
 * Arte generativo (SVG) para portadas y avatares cuando no hay imagen subida.
 * Evita usar fotos de personas reales o imágenes sin licencia en la demo.
 */
import { cn, initials } from "@/lib/utils";

const palettes: Record<string, [string, string, string]> = {
  blue: ["#2251e0", "#5fa8ff", "#dbe6ff"],
  orange: ["#f97316", "#fbbf24", "#fff1db"],
  pink: ["#d6246f", "#f472b6", "#ffe0ee"],
  green: ["#12863d", "#3fd38a", "#d9f8e6"],
  violet: ["#6d3ae0", "#b48cff", "#ece4ff"],
  teal: ["#0b8a80", "#3ed6c9", "#d6f7f3"],
};

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const paletteFor = (color?: string | null) => palettes[color ?? "blue"] ?? palettes.blue!;

export function CoverArt({ seed, color, className, label }: { seed: string; color?: string | null; className?: string; label?: string }) {
  const [a, b, c] = paletteFor(color);
  const h = hash(seed);
  const variant = h % 4;
  const id = `g${h.toString(36)}`;
  const rot = (h % 60) - 30;
  return (
    <svg viewBox="0 0 400 400" className={cn("block h-full w-full", className)} role="img" aria-label={label ?? "Arte de portada ilustrativo"} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#${id}-bg)`} />
      {variant === 0 && (
        <g transform={`rotate(${rot} 200 200)`} fill="none" stroke={c} strokeOpacity=".55">
          {[40, 80, 120, 160, 200, 240].map((r) => (
            <circle key={r} cx="260" cy="230" r={r} strokeWidth={r % 80 === 0 ? 10 : 3} />
          ))}
        </g>
      )}
      {variant === 1 && (
        <g fill="none" stroke={c} strokeOpacity=".6" strokeWidth="6" strokeLinecap="round">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M-20 ${120 + i * 40} C 80 ${60 + i * 40}, 160 ${180 + i * 40}, 260 ${110 + i * 40} S 380 ${80 + i * 40}, 430 ${140 + i * 40}`} />
          ))}
        </g>
      )}
      {variant === 2 && (
        <g>
          <circle cx="300" cy="110" r="70" fill={c} fillOpacity=".85" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={i * 52 - 10} y={250 - ((h >> i) % 5) * 24} width="30" height="400" rx="15" fill="#fff" fillOpacity={0.12 + (i % 3) * 0.07} />
          ))}
        </g>
      )}
      {variant === 3 && (
        <g transform={`rotate(${rot} 200 200)`}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x="-100" y={i * 70 - 40} width="600" height="28" fill={c} fillOpacity={0.18 + (i % 2) * 0.25} />
          ))}
          <circle cx="120" cy="290" r="54" fill="#fff" fillOpacity=".9" />
          <circle cx="120" cy="290" r="12" fill={a} />
        </g>
      )}
    </svg>
  );
}

export function ArtistAvatar({
  name,
  src,
  color,
  className,
  rounded = "full",
}: {
  name: string;
  src?: string | null;
  color?: string | null;
  className?: string;
  rounded?: "full" | "2xl";
}) {
  const r = rounded === "full" ? "rounded-full" : "rounded-2xl";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`Foto de ${name}`} className={cn("object-cover", r, className)} loading="lazy" decoding="async" />;
  }
  const [a, b] = paletteFor(color);
  return (
    <div
      className={cn("grid place-items-center font-extrabold text-white", r, className)}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      role="img"
      aria-label={`Avatar ilustrativo de ${name}`}
    >
      <span className="leading-none tracking-tight drop-shadow-sm">{initials(name)}</span>
    </div>
  );
}

export function Logo({ className, withText = true, name }: { className?: string; withText?: boolean; name: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden>
        <rect width="40" height="40" rx="12" fill="#2251e0" />
        <path d="M9 25c4-7 7-7 10 0s6 7 12-4" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="30.5" cy="12" r="3.6" fill="#f97316" />
        <circle cx="12" cy="13" r="2" fill="#e83e8c" />
      </svg>
      {withText && <span className="text-[17px] font-extrabold tracking-tight text-ink">{name}</span>}
    </span>
  );
}
