import "dotenv/config";
import postgres from "postgres";

const url = process.argv[2] ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL no configurada");
if (process.env.NODE_ENV === "production") throw new Error("db:reset está bloqueado en producción");
const sql = postgres(url, { max: 1, onnotice: () => {} });
await sql`DROP SCHEMA IF EXISTS public CASCADE`;
await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
await sql`CREATE SCHEMA public`;
await sql.end();
console.log("✔ Base de datos vaciada");
