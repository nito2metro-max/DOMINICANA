// Utilidad de desarrollo: capturas de pantalla en móvil y escritorio.
// Uso: npx tsx scripts/shot.ts /ruta [salida-dir] [--login email:pass]
import { chromium } from "playwright-core";

const [path = "/", out = "screenshots", ...rest] = process.argv.slice(2);
const loginArg = rest.find((r) => r.startsWith("--login="))?.slice(8);
const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [name, viewport, mobile] of [["mobile", { width: 390, height: 844 }, true], ["desktop", { width: 1440, height: 900 }, false]] as const) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, locale: "es-DO" });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  if (loginArg) {
    const [email, pass] = loginArg.split(":");
    await page.goto(base + "/entrar");
    await page.fill("#email", email!);
    await page.fill("#password", pass!);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/entrar")), page.click("button[type=submit]")]);
  }
  await page.goto(base + path, { waitUntil: "networkidle" });
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  const file = `${out}/${path.replace(/[^a-z0-9]+/gi, "_") || "home"}-${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(file, `scrollWidth=${width}`, errors.length ? `ERRORS: ${errors.join(" | ")}` : "");
  await ctx.close();
}
await browser.close();
