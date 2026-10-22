/**
 * Genera una vista previa estática y navegable de la app (una sola página HTML)
 * a partir de las páginas reales renderizadas por el servidor en marcha.
 * Los formularios no guardan datos: es una demostración visual.
 *
 * Uso: npx tsx scripts/build-preview.ts <archivo-salida.html>
 * Requiere la app en marcha (BASE_URL, por defecto http://localhost:3000) con los datos de demo.
 */
import { chromium, type BrowserContext } from "playwright-core";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const out = process.argv[2] ?? "preview.html";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

type Snap = { title: string; html: string };
const pages = new Map<string, Snap>();
let css = "";

/** Clave canónica de una URL interna: ruta + parámetros (sin el número de página 1). */
function keyOf(href: string): string | null {
  let u: URL;
  try {
    u = new URL(href, BASE);
  } catch {
    return null;
  }
  if (u.origin !== new URL(BASE).origin) return null;
  return u.pathname + (u.search && u.search !== "?" ? u.search : "");
}

async function crawl(ctx: BrowserContext, seeds: string[], allow: (path: string) => boolean, limit: number) {
  const page = await ctx.newPage();
  const queue = [...seeds];
  const seen = new Set<string>();
  let count = 0;
  while (queue.length && count < limit) {
    const key = queue.shift()!;
    if (seen.has(key) || pages.has(key)) continue;
    seen.add(key);
    const res = await page.goto(BASE + key, { waitUntil: "networkidle" });
    if (!res || res.status() !== 200 || keyOf(page.url()) !== key) continue;
    await page.waitForTimeout(250); // revelado del contenido en streaming
    if (!css) {
      const hrefs = await page.$$eval('link[rel="stylesheet"]', (ls) => ls.map((l) => (l as HTMLLinkElement).href));
      for (const h of hrefs) css += await (await page.request.get(h)).text();
    }
    const snap = await page.evaluate(() => {
      document.querySelectorAll("script, template, next-route-announcer, [hidden]:not(input)").forEach((n) => n.remove());
      return { title: document.title, html: document.body.innerHTML, links: Array.from(document.querySelectorAll("a[href]")).map((a) => (a as HTMLAnchorElement).href) };
    });
    pages.set(key, { title: snap.title, html: snap.html });
    count++;
    for (const l of snap.links) {
      const k = keyOf(l);
      if (k && allow(k.split("?")[0]!) && !seen.has(k) && !/[?&]pagina=1(&|$)/.test(k)) queue.push(k);
    }
  }
  await page.close();
  console.log(`  ${count} páginas`);
}

async function loginCtx(email: string, password: string) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await p.fill("#email", email);
  await p.fill("#password", password);
  await Promise.all([p.waitForURL((u) => !u.pathname.startsWith("/entrar")), p.click("button[type=submit]")]);
  await p.close();
  return ctx;
}

const isPublic = (p: string) => !/^\/(panel|admin|api)(\/|$)/.test(p) && !p.endsWith("/contratar");

console.log("▶ Público");
await crawl(await browser.newContext({ viewport: { width: 1366, height: 900 } }), ["/"], isPublic, 140);
console.log("▶ Artista");
await crawl(await loginCtx("artista@demo.local", "DemoArtista2026!"), ["/panel"], (p) => p.startsWith("/panel") && !p.includes("exportar"), 30);
console.log("▶ Promotor");
await crawl(await loginCtx("promotor@demo.local", "DemoPromotor2026!"), ["/artistas/luna-batey/contratar", "/artistas/nando-tambora/contratar"], () => false, 5);
console.log("▶ Administración");
await crawl(await loginCtx("admin@demo.local", "DemoAdmin2026!"), ["/admin"], (p) => p.startsWith("/admin"), 60);
await browser.close();

// CSS: se quitan las fuentes autoalojadas (se cargan desde Google Fonts)
css = css
  .replace(/@font-face\s*\{[^}]*\}/g, "")
  .replace(/"Plus Jakarta Sans Variable"/g, '"Plus Jakarta Sans","Plus Jakarta Sans Variable"');

const data = Object.fromEntries(pages);
const json = JSON.stringify(data).replace(/</g, "\\u003c");

const shell = `<title>Dominican Flow</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400..800&display=swap">
<style>${css}</style>
<style>
  /* Diseño claro deliberado (fondo blanco y gris claro, como pidió el cliente) */
  :root { --pv-bg: #f6f7f9; --pv-ink: #0e1726; --pv-bar: #0e1726; --pv-bar-fg: #ffffff; --pv-chip: rgba(255,255,255,.14); --pv-toast: #0e1726; color-scheme: light; }
  body { background: var(--pv-bg); color: var(--pv-ink); }
  .pv-bar { background: var(--pv-bar); color: var(--pv-bar-fg); font: 600 13px/1.3 "Plus Jakarta Sans", system-ui, sans-serif; }
  .pv-bar-in { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; padding-block: 8px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); max-width: 80rem; margin: 0 auto; }
  .pv-bar b { color: #ffb37a; }
  .pv-bar nav { display: flex; flex-wrap: wrap; gap: 6px; margin-left: auto; }
  .pv-bar a { color: var(--pv-bar-fg); background: var(--pv-chip); border-radius: 999px; padding: 4px 10px; text-decoration: none; }
  .pv-bar a:hover, .pv-bar a:focus-visible { background: rgba(255,255,255,.26); }
  #pv-toast { position: fixed; left: 50%; bottom: calc(20px + env(safe-area-inset-bottom, 0px)); transform: translate(-50%, 20px); opacity: 0; transition: .25s; z-index: 100; max-width: min(92vw, 520px); background: var(--pv-toast); color: #fff; padding: 12px 16px; border-radius: 14px; font: 500 14px/1.4 "Plus Jakarta Sans", system-ui, sans-serif; box-shadow: 0 12px 30px rgba(14,23,38,.25); pointer-events: none; }
  #pv-toast.on { opacity: 1; transform: translate(-50%, 0); }
  @media (prefers-reduced-motion: reduce) { #pv-toast { transition: none; } }
</style>
<div class="pv-bar" role="region" aria-label="Aviso de vista previa">
  <div class="pv-bar-in">
    <span><b>Vista previa</b> · páginas reales con datos de demostración · los formularios no guardan cambios</span>
    <nav aria-label="Cambiar de vista">
      <a href="/">Visitante</a><a href="/panel">Panel de artista</a><a href="/artistas/luna-batey/contratar">Promotor</a><a href="/admin">Administración</a>
    </nav>
  </div>
</div>
<div id="app" class="flex min-h-dvh flex-col"></div>
<div id="pv-toast" role="status" aria-live="polite"></div>
<script type="application/json" id="pv-pages">${json}</script>
<script>
(function () {
  var PAGES = JSON.parse(document.getElementById("pv-pages").textContent);
  var app = document.getElementById("app");
  var toastEl = document.getElementById("pv-toast");
  var current = "/";
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("on"); }, 3600);
  }
  function token(key) { return key.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "inicio"; }
  var byToken = {};
  Object.keys(PAGES).forEach(function (k) { byToken[token(k)] = k; });
  function keyOf(href) {
    try {
      var u = new URL(href, "http://x.local" + current);
      if (u.host !== "x.local") return null;
      var params = new URLSearchParams(u.search);
      if (params.get("pagina") === "1") params.delete("pagina");
      if (params.get("orden") === "recientes") params.delete("orden");
      var s = params.toString();
      return u.pathname + (s ? "?" + s : "");
    } catch (e) { return null; }
  }
  function show(key, fromHash) {
    var p = PAGES[key];
    if (!p) {
      var bare = key.split("?")[0];
      if (PAGES[bare]) { toast("Esa combinación de filtros no está en la vista previa; se muestra la página sin filtros."); key = bare; p = PAGES[bare]; }
      else { toast("Esta página no está incluida en la vista previa."); return; }
    }
    current = key;
    app.innerHTML = p.html;
    document.title = p.title;
    if (!fromHash) { try { history.replaceState(null, "", "#" + token(key)); } catch (e) {} }
    window.scrollTo(0, 0);
  }
  function go(href) { var k = keyOf(href); if (k) show(k); }

  document.addEventListener("click", function (e) {
    var t = e.target;
    var btn = t.closest && t.closest("button");
    if (btn && btn.getAttribute("aria-controls") === "mobile-menu") {
      var nav = document.getElementById("mobile-menu");
      var overlay = nav && nav.previousElementSibling;
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      [nav, overlay].forEach(function (el) {
        if (!el) return;
        el.classList.toggle("pointer-events-none", !open);
        el.classList.toggle("opacity-0", !open);
        el.classList.toggle("opacity-100", open);
        el.classList.toggle("-translate-y-2", !open);
        el.classList.toggle("translate-y-0", open);
      });
      return;
    }
    if (btn && btn.getAttribute("aria-haspopup") === "menu") { e.preventDefault(); go("/panel"); return; }
    if (btn && btn.hasAttribute("aria-pressed") && btn.type === "submit") {
      e.preventDefault();
      var on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on));
      var label = Array.prototype.find.call(btn.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      if (label) label.textContent = on ? "Siguiendo" : "Seguir";
      toast(on ? "Ahora sigues a este artista (solo en esta vista previa)." : "Has dejado de seguirlo (solo en esta vista previa).");
      return;
    }
    var a = t.closest && t.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href");
    if (/^(https?:)?\\/\\//.test(href) || /^(mailto|tel):/.test(href)) return;
    if (href.charAt(0) === "#") return;
    e.preventDefault();
    if (href.indexOf("/api/") === 0 || href.indexOf("/panel/cuenta/exportar") === 0) { toast("Las descargas no están disponibles en la vista previa."); return; }
    go(href);
  });

  var DEMO = { "artista@demo.local": "/panel", "admin@demo.local": "/admin", "promotor@demo.local": "/artistas/luna-batey/contratar", "fan@demo.local": "/artistas", "proveedor@demo.local": "/servicios" };
  function getQuery(form) {
    var params = new URLSearchParams();
    new FormData(form).forEach(function (v, k) { if (typeof v === "string" && v) params.set(k, v); });
    return params;
  }
  document.addEventListener("submit", function (e) {
    var form = e.target;
    e.preventDefault();
    var action = form.getAttribute("action") || "";
    if (action.charAt(0) === "/" && (form.method || "get").toLowerCase() === "get") {
      var q = getQuery(form).toString();
      go(action + (q ? "?" + q : ""));
      return;
    }
    if (form.querySelector("#email") && form.querySelector("#password") && !form.querySelector("[name=acceptTerms]")) {
      var email = (form.querySelector("#email").value || "").trim().toLowerCase();
      if (DEMO[email]) { show(DEMO[email]); toast("Sesión de demostración iniciada (sin comprobar contraseña en la vista previa)."); }
      else toast("Usa una cuenta de demo: artista@demo.local, promotor@demo.local, fan@demo.local o admin@demo.local.");
      return;
    }
    toast("Vista previa: este formulario no guarda datos. En la app real se valida y se guarda en el servidor.");
  }, true);
  document.addEventListener("change", function (e) {
    var form = e.target.form;
    if (form && form.hasAttribute("data-df-form") && form.getAttribute("action") && e.target.type !== "search") {
      var q = getQuery(form).toString();
      go(form.getAttribute("action") + (q ? "?" + q : ""));
    }
  });

  var start = byToken[(location.hash || "").slice(1)] || "/";
  show(start, true);
  window.addEventListener("hashchange", function () { var k = byToken[location.hash.slice(1)]; if (k && k !== current) show(k, true); });
})();
</script>
`;
writeFileSync(out, shell);
console.log(`✔ ${pages.size} páginas → ${out} (${(shell.length / 1024 / 1024).toFixed(2)} MB)`);
