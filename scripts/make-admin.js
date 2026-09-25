// Turns an existing account into an admin.
// Usage: npm run make-admin -- someone@example.com
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());
const { Client } = require("pg");
const { pgConfig } = require("./pg-config");

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run make-admin -- someone@example.com");
    process.exit(1);
  }
  const client = new Client(pgConfig(process.env.DATABASE_URL));
  await client.connect();
  const res = await client.query("UPDATE users SET role = 'ADMIN' WHERE email = $1 RETURNING id, name", [email]);
  await client.end();
  if (res.rowCount === 0) {
    console.error(`✖ No account found for ${email}. Sign up on the website first.`);
    process.exit(1);
  }
  console.log(`✓ ${res.rows[0].name} (${email}) is now an admin. Log out and back in to see the Admin menu.`);
}

main().catch((err) => {
  console.error("✖", err.message);
  process.exit(1);
});
