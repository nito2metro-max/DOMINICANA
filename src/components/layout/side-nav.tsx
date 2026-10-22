"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Compass,
  Disc3,
  Flag,
  Heart,
  Inbox,
  LayoutDashboard,
  Mail,
  Newspaper,
  Settings,
  Sparkles,
  Star,
  User,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  user: User,
  disc: Disc3,
  inbox: Inbox,
  chart: BarChart3,
  compass: Compass,
  sparkles: Sparkles,
  heart: Heart,
  settings: Settings,
  users: Users,
  badge: BadgeCheck,
  wrench: Wrench,
  calendar: CalendarDays,
  news: Newspaper,
  star: Star,
  flag: Flag,
  mail: Mail,
  briefcase: Briefcase,
};

export type SideNavItem = { href: string; label: string; icon: keyof typeof icons; badge?: number };

export function SideNav({ items, title }: { items: SideNavItem[]; title: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/panel" || href === "/admin" ? pathname === href : pathname.startsWith(href));
  return (
    <nav aria-label={title}>
      {/* Móvil: pestañas desplazables */}
      <ul className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2 lg:hidden">
        {items.map((i) => {
          const Icon = icons[i.icon]!;
          return (
            <li key={i.href} className="shrink-0">
              <Link
                href={i.href}
                aria-current={isActive(i.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold",
                  isActive(i.href) ? "bg-brand-600 text-white" : "bg-white text-ink-2 ring-1 ring-line",
                )}
              >
                <Icon className="size-4" /> {i.label}
                {!!i.badge && <span className="rounded-full bg-sun-500 px-1.5 text-[11px] text-white">{i.badge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Escritorio: barra lateral */}
      <ul className="hidden space-y-0.5 lg:block">
        <li className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-muted">{title}</li>
        {items.map((i) => {
          const Icon = icons[i.icon]!;
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={isActive(i.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  isActive(i.href) ? "bg-brand-50 text-brand-700" : "text-ink-2 hover:bg-white hover:text-ink",
                )}
              >
                <Icon className="size-[18px]" /> <span className="flex-1">{i.label}</span>
                {!!i.badge && <span className="rounded-full bg-sun-500 px-2 py-0.5 text-[11px] text-white">{i.badge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
