import { BadgeCheck, FlaskConical, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "brand" | "sun" | "rose" | "palm" | "warn";

const tones: Record<Tone, string> = {
  neutral: "bg-canvas text-ink-2 ring-line",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  sun: "bg-sun-50 text-sun-700 ring-sun-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  palm: "bg-palm-50 text-palm-700 ring-palm-100",
  warn: "bg-amber-50 text-amber-800 ring-amber-200",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Etiqueta obligatoria para todo contenido ficticio de demostración. */
export function DemoBadge({ className, label = "Demo" }: { className?: string; label?: string }) {
  return (
    <Badge tone="warn" className={className}>
      <FlaskConical className="size-3" aria-hidden />
      <span>
        {label}
        <span className="sr-only"> — contenido ficticio de demostración</span>
      </span>
    </Badge>
  );
}

/** Etiqueta obligatoria para contenido patrocinado. */
export function SponsoredBadge({ sponsor, className }: { sponsor?: string | null; className?: string }) {
  return (
    <Badge tone="sun" className={className}>
      <Megaphone className="size-3" aria-hidden />
      Patrocinado{sponsor ? ` · ${sponsor}` : ""}
    </Badge>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center text-brand-600", className)} title="Identidad verificada por el equipo de la plataforma">
      <BadgeCheck className="size-[1.1em]" aria-hidden />
      <span className="sr-only">Verificado</span>
    </span>
  );
}

export const genreTone = (color?: string | null): Tone =>
  color === "orange" ? "sun" : color === "pink" ? "rose" : color === "green" ? "palm" : color === "blue" ? "brand" : "neutral";
