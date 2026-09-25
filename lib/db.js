import { Pool } from "pg";

// One connection pool per server instance (re-used across requests and hot reloads).
const globalForDb = globalThis;

function createPool() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local (local) or Vercel environment variables.");
  }
  const url = new URL(raw);
  const isLocal =
    ["localhost", "127.0.0.1", "::1"].includes(url.hostname) || process.env.DATABASE_SSL === "false";
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return new Pool({
    connectionString: url.toString(),
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
}

function getPool() {
  if (!globalForDb.__researchPool) globalForDb.__researchPool = createPool();
  return globalForDb.__researchPool;
}

/** Run a query and return all rows. */
export async function many(text, params = []) {
  const res = await getPool().query(text, params);
  return res.rows;
}

/** Run a query and return the first row (or null). */
export async function one(text, params = []) {
  const res = await getPool().query(text, params);
  return res.rows[0] ?? null;
}

/** Run a query and return the full result (rowCount etc.). */
export async function exec(text, params = []) {
  return getPool().query(text, params);
}
