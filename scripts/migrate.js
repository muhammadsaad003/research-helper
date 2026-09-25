// Creates the database tables if they don't exist yet.
// Runs automatically before "next build" (so on every Vercel deploy),
// and you can run it yourself with: npm run db:migrate
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { pgConfig } = require("./pg-config");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.SKIP_DB_MIGRATE === "1") {
      console.log("• SKIP_DB_MIGRATE=1, skipping database setup.");
      return;
    }
    console.error(
      "\n✖ DATABASE_URL is not set.\n" +
        "  Locally: put it in .env.local\n" +
        "  On Vercel: Project > Settings > Environment Variables, then redeploy.\n"
    );
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");
  const client = new Client(pgConfig(url));
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("✓ Database tables are ready.");
}

main().catch((err) => {
  console.error("\n✖ Database setup failed:", err.message);
  console.error("  Check that DATABASE_URL is correct and the database is running.\n");
  process.exit(1);
});
