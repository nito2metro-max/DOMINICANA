/**
 * Prueba de humo end-to-end con un navegador real (Chromium vía playwright-core).
 * Requiere la app en marcha (BASE_URL, por defecto http://localhost:3000) con los datos de demo.
 * Modifica la base de datos: ejecuta `npm run db:reset` después si quieres volver al estado inicial.
 *
 * Uso: npm run test:e2e
 */
import { chromium, type BrowserContext, type Locator, type Page } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let failures = 0;
const ok = (msg: string) => console.log(`  ✔ ${msg}`);
const fail = (msg: string) => {
  failures++;
  console.log(`  ✘ ${msg}`);
};
const check = (cond: unknown, msg: string) => (cond ? ok(msg) : fail(msg));
/** Espera a que el elemento sea visible (el contenido en streaming se revela tras el evento load). */
const visible = (l: Locator, timeout = 10000) =>
  l
    .first()
    .waitFor({ state: "visible", timeout })
    .then(() => true)
    .catch(() => false);

/** Espera a que los formularios de la página estén hidratados por React antes de interactuar. */
async function hydrated(p: Page) {
  if (await p.locator("form[data-df-form]").count()) await p.locator("form[data-df-form][data-hydrated]").first().waitFor({ state: "attached", timeout: 20000 });
}

async function newCtx(mobile = false) {
  return browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "es-DO" }
      : { viewport: { width: 1366, height: 900 }, locale: "es-DO" },
  );
}

async function login(ctx: BrowserContext, email: string, password: string) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await hydrated(page);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/entrar")), page.click("button[type=submit]")]);
  return page;
}

async function step(name: string, fn: () => Promise<void>) {
  console.log(`\n▶ ${name}`);
  try {
    await fn();
  } catch (e) {
    fail(`excepción: ${(e as Error).message.split("\n")[0]}`);
  }
}

/* 1. Páginas públicas: sin errores de consola ni desbordamiento horizontal en móvil */
await step("Páginas públicas en móvil (390px) y escritorio", async () => {
  const pages = ["/", "/artistas", "/artistas/luna-batey", "/lanzamientos", "/servicios", "/servicios/diseno-de-portadas", "/oportunidades", "/oportunidades/concurso-cancion-de-barrio", "/eventos", "/editorial", "/editorial/talento-de-la-semana-mia-cayena", "/contrataciones", "/negocios", "/buscar?q=bachata", "/legal/derechos", "/entrar", "/registro"];
  for (const mobile of [true, false]) {
    const ctx = await newCtx(mobile);
    const page = await ctx.newPage();
    for (const p of pages) {
      const errors: string[] = [];
      page.removeAllListeners("pageerror");
      page.removeAllListeners("console");
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      const res = await page.goto(BASE + p, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (res?.status() !== 200 || overflow > 0 || errors.length) fail(`${mobile ? "móvil" : "escritorio"} ${p}: status=${res?.status()} overflow=${overflow} ${errors.join(" | ")}`);
    }
    ok(`${pages.length} páginas OK en ${mobile ? "móvil" : "escritorio"}`);
    await ctx.close();
  }
  const ctx = await newCtx();
  const page = await ctx.newPage();
  const r = await page.goto(`${BASE}/artistas/no-existe`, { waitUntil: "networkidle" });
  await hydrated(page);
  check(r?.status() === 404, `perfil inexistente devuelve 404 (recibido ${r?.status()})`);
  await ctx.close();
});

/* 2. Búsqueda y filtros */
await step("Búsqueda y filtros del catálogo", async () => {
  const ctx = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/artistas?genero=bachata`, { waitUntil: "networkidle" });
  await hydrated(page);
  await visible(page.locator("main h3"));
  const names = await page.locator("main h3").allTextContents();
  check(names.some((n) => n.includes("Luna Batey")) && names.every((n) => !n.includes("Zafiro")), "filtro por género");
  await page.goto(`${BASE}/artistas?q=zzzzzz`, { waitUntil: "networkidle" });
  await hydrated(page);
  check(await visible(page.getByText("No encontramos artistas")), "estado vacío en búsqueda sin resultados");
  await page.goto(`${BASE}/artistas`, { waitUntil: "networkidle" });
  await hydrated(page);
  await page.selectOption("#provincia", "Puerto Plata");
  await page.waitForURL(/provincia=Puerto/);
  await page.waitForLoadState("networkidle");
  await visible(page.locator("main h3"));
  const pp = await page.locator("main h3").allTextContents();
  check(pp.length > 0 && pp.every((n) => /Brisa|Cabarete/.test(n)), `filtro automático por provincia (${pp.join(", ")})`);
  await ctx.close();
});

/* 3. Registro de artista, edición de perfil y subida de imagen */
const newEmail = `nuevo${Date.now()}@test.local`;
await step("Registro de artista, perfil y subida de imágenes", async () => {
  const ctx = await newCtx(true);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/registro?tipo=artist`, { waitUntil: "networkidle" });
  await hydrated(page);
  await page.click("button[type=submit]");
  check(await visible(page.getByText("Revisa los campos marcados")), "validación de formulario vacío");
  await page.fill("#name", "Prueba Merenguera");
  await page.fill("#email", newEmail);
  await page.fill("#password", "Clave12345segura");
  await page.check("input[name=acceptTerms]");
  await Promise.all([page.waitForURL(/\/panel\/perfil/), page.click("button[type=submit]")]);
  await page.waitForLoadState("networkidle");
  await hydrated(page);
  ok("registro y redirección al editor de perfil");
  await page.selectOption("#genreId", { label: "Merengue" });
  await page.selectOption("#province", "La Romana");
  await page.fill("#shortBio", "Merengue de orquesta con energía de pista.");
  await page.fill("#bio", "Biografía de prueba.");
  await page.check("input[name=isPublished]");
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await page.getByText("Perfil guardado y publicado").waitFor({ timeout: 10000 });
  ok("perfil guardado y publicado");

  const dir = path.join(os.tmpdir(), "df-e2e");
  mkdirSync(dir, { recursive: true });
  // PNG 1x1 válido
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  writeFileSync(path.join(dir, "avatar.png"), png);
  writeFileSync(path.join(dir, "falso.png"), "<script>alert(1)</script>");
  const avatarForm = page.locator("form", { has: page.getByText("Foto de perfil") });
  await avatarForm.locator("input[type=file]").setInputFiles(path.join(dir, "falso.png"));
  await avatarForm.getByRole("button", { name: "Subir imagen" }).click();
  await avatarForm.getByText("Formato no permitido").waitFor({ timeout: 10000 });
  ok("rechaza archivo falso con extensión .png");
  await avatarForm.locator("input[type=file]").setInputFiles(path.join(dir, "avatar.png"));
  await avatarForm.getByRole("button", { name: "Subir imagen" }).click();
  await avatarForm.getByText("Imagen actualizada").waitFor({ timeout: 10000 });
  const src = await page.locator('img[alt^="Vista previa: Foto"]').getAttribute("src");
  ok("sube imagen válida");
  await page.goto(`${BASE}/artistas?q=Prueba%20Merenguera`, { waitUntil: "networkidle" });
  await hydrated(page);
  check(await visible(page.getByText("Prueba Merenguera")), "el nuevo artista aparece en el catálogo");
  if (src?.startsWith("/api/files/")) {
    const r = await page.request.get(BASE + src);
    check(r.status() === 200 && r.headers()["content-type"] === "image/png", "la imagen se sirve con tipo correcto");
  }

  // Contenido con confirmación de derechos
  await page.goto(`${BASE}/panel/musica`, { waitUntil: "networkidle" });
  await hydrated(page);
  await page.fill("#m-title", "Video oficial");
  await page.fill("#m-url", "https://www.youtube.com/watch?v=abcdefghijk");
  await page.getByRole("button", { name: "Publicar contenido" }).click();
  await page.getByText("Debes confirmar que tienes los derechos").waitFor({ timeout: 10000 });
  ok("exige confirmación de derechos");
  await ctx.close();
});

/* 4. Flujo de contratación entre promotor y artista */
let bookingUrl = "";
await step("Solicitud de contratación: promotor → artista", async () => {
  const ctx = await newCtx();
  const page = await login(ctx, "promotor@demo.local", "DemoPromotor2026!");
  const r = await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await hydrated(page);
  check(page.url().includes("/panel?error=permiso") || r?.url().includes("error=permiso"), "un promotor no puede entrar a /admin");
  await page.goto(`${BASE}/artistas/luna-batey`, { waitUntil: "networkidle" });
  await hydrated(page);
  await page.getByRole("link", { name: "Solicitar contratación" }).click();
  await page.waitForURL(/contratar/);
  await hydrated(page);
  await page.selectOption("#eventType", "restaurante");
  const d = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10);
  await page.fill("#eventDate", d);
  await page.fill("#location", "Zona Colonial, Santo Domingo");
  await page.fill("#budgetMin", "30000");
  await page.fill("#budgetMax", "20000");
  await page.fill("#details", "Cena de aniversario, set acústico de 45 minutos.");
  await page.click("button[type=submit]");
  await page.getByText("El presupuesto mínimo no puede superar al máximo").waitFor({ timeout: 10000 });
  ok("valida presupuesto incoherente");
  await page.fill("#budgetMax", "45000");
  await Promise.all([page.waitForURL(/\/panel\/solicitudes\/.+enviada=1/), page.click("button[type=submit]")]);
  bookingUrl = page.url().split("?")[0]!;
  check(await visible(page.getByText("¡Solicitud enviada!")), "solicitud creada y visible para el promotor");
  check(!(await page.getByRole("button", { name: "Aceptar" }).count()), "el promotor no tiene la acción de aceptar");
  await ctx.close();

  const ctx2 = await newCtx(true);
  const ap = await login(ctx2, "artista@demo.local", "DemoArtista2026!");
  await ap.goto(bookingUrl, { waitUntil: "networkidle" });
  check(await visible(ap.getByText("El correo del solicitante se mostrará")), "correo oculto mientras está pendiente");
  await ap.getByRole("button", { name: "Pasar a negociación" }).click();
  await ap.getByText("Estado actualizado").waitFor({ timeout: 10000 });
  await ap.reload();
  check(await visible(ap.getByText("promotor@demo.local")), "tras negociar, el artista ve el correo del solicitante");
  await ap.fill("textarea[name=body]", "¡Hola! Tengo disponibilidad.");
  await ap.getByRole("button", { name: "Enviar mensaje" }).click();
  await ap.getByText("¡Hola! Tengo disponibilidad.").waitFor({ timeout: 10000 });
  ok("mensaje enviado en la conversación");
  await ctx2.close();

  // Un tercero no puede ver la solicitud
  const ctx3 = await newCtx();
  const tp = await login(ctx3, newEmail, "Clave12345segura");
  const res = await tp.goto(bookingUrl);
  check(res?.status() === 404, `un tercero recibe 404 al abrir la solicitud ajena (recibido ${res?.status()})`);
  const leaked = (await tp.content()).includes("Cena de aniversario");
  check(!leaked, "no se filtran datos de la solicitud ajena");
  await ctx3.close();
});

/* 5. Fan: seguir artista, denunciar contenido */
await step("Fan: seguir artista y denunciar", async () => {
  const ctx = await newCtx(true);
  const page = await login(ctx, "fan@demo.local", "DemoFan2026!");
  await page.goto(`${BASE}/artistas/rocio-samana`, { waitUntil: "networkidle" });
  await hydrated(page);
  await page.getByRole("button", { name: "Seguir" }).click();
  await page.getByRole("button", { name: "Siguiendo" }).waitFor({ timeout: 10000 });
  ok("seguir artista");
  await page.goto(`${BASE}/panel/guardados`, { waitUntil: "networkidle" });
  await hydrated(page);
  check(await visible(page.getByText("Rocío Samaná")), "aparece en artistas guardados");
  await page.goto(`${BASE}/artistas/rocio-samana`, { waitUntil: "networkidle" });
  await hydrated(page);
  await page.getByRole("link", { name: "Reportar este perfil" }).click();
  await page.fill("#details", "Este perfil usa fotos de otra persona sin permiso (prueba).");
  await page.check("input[name=goodFaith]");
  await page.getByRole("button", { name: "Enviar denuncia" }).click();
  await page.getByText("Denuncia registrada").waitFor({ timeout: 10000 });
  ok("denuncia registrada");
  await ctx.close();
});

/* 6. Administración */
await step("Administración: denuncias, destacados y servicios", async () => {
  const ctx = await newCtx();
  const page = await login(ctx, "admin@demo.local", "DemoAdmin2026!");
  check(page.url().endsWith("/admin"), "el admin entra al panel de administración");
  for (const p of ["/admin/artistas", "/admin/verificaciones", "/admin/contenido", "/admin/denuncias", "/admin/destacados", "/admin/editorial", "/admin/editorial/nuevo", "/admin/oportunidades", "/admin/oportunidades/nuevo", "/admin/eventos", "/admin/eventos/nuevo", "/admin/servicios", "/admin/servicios/nuevo", "/admin/proveedores", "/admin/solicitudes", "/admin/contactos", "/admin/usuarios"]) {
    const r = await page.goto(BASE + p);
    if (r?.status() !== 200) fail(`${p} → ${r?.status()}`);
  }
  ok("todas las páginas de administración cargan");
  await page.goto(`${BASE}/admin/denuncias`, { waitUntil: "networkidle" });
  await hydrated(page);
  check(await visible(page.getByText("Infracción de derechos de autor")), "la denuncia aparece en la cola");
  await page.goto(`${BASE}/admin/destacados`, { waitUntil: "networkidle" });
  await hydrated(page);
  await page.selectOption("#artistId", { index: 1 });
  await page.selectOption("#kind", "patrocinado");
  await page.fill("#reason", "Campaña de prueba sin patrocinador");
  await page.getByRole("button", { name: "Crear destacado" }).click();
  await page.getByText("Un espacio patrocinado debe indicar quién lo patrocina").waitFor({ timeout: 10000 });
  ok("bloquea patrocinio sin patrocinador identificado");
  await page.goto(`${BASE}/admin/servicios/nuevo`, { waitUntil: "networkidle" });
  await hydrated(page);
  await page.fill("#title", "Servicio de prueba");
  await page.fill("#category", "Pruebas");
  await page.fill("#summary", "Resumen del servicio de prueba");
  await page.fill("#description", "Descripción del servicio de prueba suficientemente larga.");
  await page.selectOption("#status", "active");
  await page.getByRole("button", { name: "Guardar servicio" }).click();
  await page.getByText("Un servicio solo puede marcarse como activo si tiene un proveedor asignado").waitFor({ timeout: 10000 });
  ok("no permite servicio activo sin proveedor");
  await ctx.close();
});

await browser.close();
console.log(failures ? `\n✘ ${failures} comprobación(es) fallida(s)` : "\n✔ Todas las comprobaciones E2E pasaron");
process.exit(failures ? 1 : 0);
