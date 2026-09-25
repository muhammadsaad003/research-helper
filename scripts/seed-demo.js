// Optional: creates two demo accounts and a welcome announcement,
// handy for showing the project to your teacher.
// Usage: npm run seed
//   admin@demo.com / demo1234  (ADMIN)
//   user@demo.com  / demo1234  (USER)
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());
const bcrypt = require("bcryptjs");
const { Client } = require("pg");
const { pgConfig } = require("./pg-config");

async function main() {
  const client = new Client(pgConfig(process.env.DATABASE_URL));
  await client.connect();
  const hash = await bcrypt.hash("demo1234", 10);
  const accounts = [
    ["Demo Admin", "admin@demo.com", "ADMIN"],
    ["Demo User", "user@demo.com", "USER"],
  ];
  for (const [name, email, role] of accounts) {
    await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role`,
      [name, email, hash, role]
    );
  }
  const existing = await client.query("SELECT COUNT(*)::int AS n FROM announcements");
  if (existing.rows[0].n === 0) {
    await client.query(
      "INSERT INTO announcements (title, body) VALUES ($1, $2)",
      ["Welcome to Research Helper", "Search for a topic, save papers to your library and export citations in one click."]
    );
  }
  await client.end();
  console.log("✓ Demo data ready. Log in with admin@demo.com or user@demo.com (password: demo1234).");
  console.log("  Change or delete these accounts before sharing the site publicly.");
}

main().catch((err) => {
  console.error("✖", err.message);
  process.exit(1);
});
