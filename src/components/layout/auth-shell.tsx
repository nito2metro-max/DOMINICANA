import type { ReactNode } from "react";
import { CoverArt } from "@/components/brand/art";
import { siteConfig } from "@/config/site";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="container-page grid gap-10 py-10 sm:py-16 lg:grid-cols-2 lg:items-center">
      <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="mt-1 text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <div className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">{footer}</div>
      </div>
      <div className="relative hidden aspect-square max-h-[560px] overflow-hidden rounded-3xl lg:block">
        <CoverArt seed="auth-dominican-flow" color="blue" label="" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-8 text-white">
          <p className="text-3xl font-extrabold leading-tight">{siteConfig.tagline}</p>
          <p className="mt-2 text-white/85">Registro gratuito para artistas. Sin compras de seguidores, sin estadísticas infladas.</p>
        </div>
      </div>
    </div>
  );
}
