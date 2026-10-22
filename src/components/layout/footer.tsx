import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/brand/art";

const cols = [
  {
    title: "Descubre",
    links: [
      ["/artistas", "Artistas"],
      ["/lanzamientos", "Nuevos lanzamientos"],
      ["/editorial", "Editorial"],
      ["/eventos", "Eventos y showcases"],
    ],
  },
  {
    title: "Para artistas",
    links: [
      ["/registro?tipo=artist", "Crear perfil gratis"],
      ["/servicios", "Servicios profesionales"],
      ["/oportunidades", "Convocatorias"],
      ["/panel", "Mi panel"],
    ],
  },
  {
    title: "Para negocios",
    links: [
      ["/contrataciones", "Contratar artistas"],
      ["/negocios", "Marcas y patrocinios"],
      ["/registro?tipo=provider", "Ofrecer servicios"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["/legal/terminos", "Términos de uso"],
      ["/legal/privacidad", "Privacidad"],
      ["/legal/derechos", "Derechos de autor y retirada"],
      ["/reportar", "Reportar contenido"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <Logo name={siteConfig.name} />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {siteConfig.tagline}. Descubrimiento, desarrollo y oportunidades para el talento musical de República Dominicana.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-bold">{c.title}</h3>
            <ul className="mt-3 space-y-2.5">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted transition hover:text-brand-600">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Versión preliminar (beta).
          </p>
          <p>Los perfiles marcados como «Demo» son ficticios y sirven solo para ilustrar la plataforma.</p>
        </div>
      </div>
    </footer>
  );
}
