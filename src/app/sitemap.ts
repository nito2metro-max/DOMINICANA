import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { listArtists } from "@/server/artists";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["", "/artistas", "/lanzamientos", "/servicios", "/oportunidades", "/eventos", "/editorial", "/contrataciones", "/negocios"];
  const { items } = await listArtists({ limit: 60 });
  return [
    ...statics.map((p) => ({ url: `${siteConfig.url}${p}` })),
    ...items.filter((a) => !a.isDemo).map((a) => ({ url: `${siteConfig.url}/artistas/${a.slug}` })),
  ];
}
