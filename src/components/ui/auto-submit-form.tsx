"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/** Formulario GET que se envía al cambiar un filtro (y funciona sin JavaScript con el botón). */
export function AutoSubmitForm({ action, children, className }: { action: string; children: ReactNode; className?: string }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <form
      action={action}
      className={className}
      data-df-form=""
      data-hydrated={hydrated || undefined}
      onChange={(e) => {
        const el = e.target as HTMLElement;
        if (el.tagName === "INPUT" && (el as HTMLInputElement).type === "search") return;
        const form = e.currentTarget;
        const params = new URLSearchParams();
        for (const [k, v] of new FormData(form).entries()) if (typeof v === "string" && v) params.set(k, v);
        router.replace(`${action}?${params.toString()}`, { scroll: false });
      }}
    >
      {children}
    </form>
  );
}
