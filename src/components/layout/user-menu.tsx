"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Settings, Shield } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { initials } from "@/lib/utils";
import { roleLabels } from "@/config/site";

export function UserMenu({ name, role }: { name: string; role: keyof typeof roleLabels }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-2.5 text-sm font-semibold hover:border-line-strong"
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{initials(name)}</span>
        <span className="max-w-28 truncate">{name.split(" ")[0]}</span>
        <ChevronDown className="size-4 text-muted" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 animate-fade-up rounded-2xl border border-line bg-white p-1.5 shadow-lift">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold">{name}</p>
            <p className="text-xs text-muted">{roleLabels[role]}</p>
          </div>
          <Link role="menuitem" href="/panel" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-canvas">
            <LayoutDashboard className="size-4" /> Mi panel
          </Link>
          {role === "admin" && (
            <Link role="menuitem" href="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-canvas">
              <Shield className="size-4" /> Administración
            </Link>
          )}
          <Link role="menuitem" href="/panel/cuenta" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-canvas">
            <Settings className="size-4" /> Cuenta y privacidad
          </Link>
          <form action={logoutAction}>
            <button role="menuitem" type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
