/**
 * Solo se incrustan reproductores OFICIALES de cada plataforma (nunca se descargan
 * ni se alojan archivos de audio/video). Devuelve null si no hay reproductor oficial.
 */
export function toEmbedUrl(platform: string, raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (platform === "youtube") {
    let id: string | null = null;
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    else if (u.pathname === "/watch") id = u.searchParams.get("v");
    else if (u.pathname.startsWith("/shorts/") || u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] ?? null;
    return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (platform === "spotify" && u.hostname === "open.spotify.com") {
    const m = u.pathname.match(/^\/(?:intl-[a-z]+\/)?(track|album|artist|playlist|episode)\/([A-Za-z0-9]{10,40})/);
    return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
  }
  return null;
}
