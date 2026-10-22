import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { countOpenBookingsForArtistUser } from "@/server/bookings";
import { SideNav, type SideNavItem } from "@/components/layout/side-nav";
import { roleLabels } from "@/config/site";

export const metadata: Metadata = { title: "Mi panel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items: SideNavItem[] = [{ href: "/panel", label: "Resumen", icon: "dashboard" }];
  if (user.role === "artist") {
    const open = await countOpenBookingsForArtistUser(user.id);
    items.push(
      { href: "/panel/perfil", label: "Mi perfil", icon: "user" },
      { href: "/panel/musica", label: "Música y contenido", icon: "disc" },
      { href: "/panel/solicitudes", label: "Contrataciones", icon: "inbox", badge: open },
      { href: "/panel/estadisticas", label: "Estadísticas", icon: "chart" },
      { href: "/panel/oportunidades", label: "Oportunidades", icon: "compass" },
      { href: "/panel/servicios", label: "Servicios", icon: "sparkles" },
    );
  } else {
    items.push({ href: "/panel/solicitudes", label: "Mis solicitudes", icon: "inbox" }, { href: "/panel/servicios", label: "Servicios solicitados", icon: "sparkles" });
  }
  items.push({ href: "/panel/guardados", label: "Artistas guardados", icon: "heart" }, { href: "/panel/cuenta", label: "Cuenta y privacidad", icon: "settings" });

  return (
    <div className="container-page grid gap-6 py-6 lg:grid-cols-[240px_1fr] lg:gap-10 lg:py-10">
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="mb-4 hidden px-3 lg:block">
          <p className="truncate font-bold">{user.name}</p>
          <p className="text-sm text-muted">{roleLabels[user.role]}</p>
        </div>
        <SideNav items={items} title="Mi panel" />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
