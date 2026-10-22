import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __dbClient: ReturnType<typeof postgres> | undefined;
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL no está configurada. Copia .env.example a .env");

// Reutiliza la conexión entre recargas en desarrollo
const client = globalThis.__dbClient ?? postgres(url, { max: 10, prepare: false });
if (process.env.NODE_ENV !== "production") globalThis.__dbClient = client;

export const db = drizzle(client, { schema });
export type DB = typeof db;
export { schema };
