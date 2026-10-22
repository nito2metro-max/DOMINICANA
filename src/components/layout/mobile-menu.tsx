"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";

export function MobileMenu({ items, loggedIn, isAdmin }: { items: ReadonlyArray<{ href: string; label: string }>; loggedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center rounded-full text-ink hover:bg-canvas"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      <div
        className={cn("fixed inset-0 top-[calc(4rem+env(safe-area-inset-top))] z-40 bg-ink/20 transition-opacity", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <nav
        id="mobile-menu"
        aria-label="Menú móvil"
        className={cn(
          "fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-white px-4 pt-3 shadow-lift transition duration-200",
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <ul className="grid gap-1">
          {items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                className={cn(
                  "block rounded-xl px-3 py-3 text-base font-semibold",
                  pathname.startsWith(i.href) ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-canvas",
                )}
              >
                {i.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/contrataciones" className="block rounded-xl px-3 py-3 text-base font-semibold text-ink hover:bg-canvas">
              Contrataciones
            </Link>
          </li>
          <li>
            <Link href="/negocios" className="block rounded-xl px-3 py-3 text-base font-semibold text-ink hover:bg-canvas">
              Para marcas y negocios
            </Link>
          </li>
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4">
          {loggedIn ? (
            <>
              <Link href="/panel" className={buttonClasses("primary", "md")}>
                Mi panel
              </Link>
              {isAdmin ? (
                <Link href="/admin" className={buttonClasses("outline", "md")}>
                  Administración
                </Link>
              ) : (
                <Link href="/panel/cuenta" className={buttonClasses("outline", "md")}>
                  Mi cuenta
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/entrar" className={buttonClasses("outline", "md")}>
                Iniciar sesión
              </Link>
              <Link href="/registro" className={buttonClasses("primary", "md")}>
                Únete gratis
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
