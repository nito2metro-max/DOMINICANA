import "dotenv/config";
import { execFileSync } from "node:child_process";

/** Recrea la base de datos de pruebas desde cero y aplica las migraciones. */
export default function setup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error("Define DATABASE_URL_TEST en .env para ejecutar las pruebas");
  if (url === process.env.DATABASE_URL) throw new Error("DATABASE_URL_TEST no puede ser la misma base de datos que DATABASE_URL");
  execFileSync("npx", ["tsx", "scripts/reset.ts", url], { stdio: "inherit" });
  execFileSync("npx", ["tsx", "scripts/migrate.ts", url], { stdio: "inherit" });
}
