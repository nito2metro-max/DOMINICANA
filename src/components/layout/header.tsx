import Link from "next/link";
import { Search } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/session";
import { Logo } from "@/components/brand/art";
import { LinkButton } from "@/components/ui/button";
import { mainNav } from "./nav";
import { NavLinks } from "./nav-links";
import { MobileMenu } from "./mobile-menu";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="shrink-0 rounded-xl" aria-label={`${siteConfig.name}, inicio`}>
          <Logo name={siteConfig.name} />
        </Link>
        <NavLinks items={mainNav} />
        <div className="ml-auto flex items-center gap-2">
          <form action="/buscar" role="search" className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="header-q" className="sr-only">
              Buscar artistas, lanzamientos u oportunidades
            </label>
            <input
              id="header-q"
              name="q"
              type="search"
              placeholder="Buscar artistas…"
              className="h-10 w-44 rounded-full border border-line bg-canvas pl-9 pr-3 text-sm transition-[width,border-color] focus:w-60 focus:border-brand-400 focus:bg-white focus:outline-none lg:w-52"
            />
          </form>
          <Link href="/buscar" className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-canvas md:hidden" aria-label="Buscar">
            <Search className="size-5" />
          </Link>
          {user ? (
            <UserMenu name={user.name} role={user.role} />
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <LinkButton href="/entrar" variant="ghost" size="sm">
                Iniciar sesión
              </LinkButton>
              <LinkButton href="/registro" size="sm">
                Únete gratis
              </LinkButton>
            </div>
          )}
          <MobileMenu items={mainNav} loggedIn={!!user} isAdmin={user?.role === "admin"} />
        </div>
      </div>
    </header>
  );
}
