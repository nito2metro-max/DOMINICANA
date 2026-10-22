import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { adminMetrics } from "@/server/admin";
import { SideNav } from "@/components/layout/side-nav";

export const metadata: Metadata = { title: "Administración", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const m = await adminMetrics(admin);
  return (
    <div className="container-page grid gap-6 py-6 lg:grid-cols-[240px_1fr] lg:gap-10 lg:py-10">
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <SideNav
          title="Administración"
          items={[
            { href: "/admin", label: "Resumen", icon: "dashboard" },
            { href: "/admin/artistas", label: "Artistas", icon: "users" },
            { href: "/admin/verificaciones", label: "Verificaciones", icon: "badge", badge: m.pendingVerif },
            { href: "/admin/contenido", label: "Contenido en revisión", icon: "disc" },
            { href: "/admin/denuncias", label: "Denuncias", icon: "flag", badge: m.openReports },
            { href: "/admin/destacados", label: "Destacados", icon: "star" },
            { href: "/admin/editorial", label: "Editorial", icon: "news" },
            { href: "/admin/oportunidades", label: "Oportunidades", icon: "compass" },
            { href: "/admin/eventos", label: "Eventos", icon: "calendar" },
            { href: "/admin/servicios", label: "Servicios", icon: "sparkles" },
            { href: "/admin/proveedores", label: "Proveedores", icon: "wrench" },
            { href: "/admin/solicitudes", label: "Contrataciones", icon: "inbox" },
            { href: "/admin/contactos", label: "Contactos", icon: "mail", badge: m.newInquiries + m.newLeads },
            { href: "/admin/usuarios", label: "Usuarios y permisos", icon: "settings" },
          ]}
        />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
