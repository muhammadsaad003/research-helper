// Checks the settings (environment variables) before building, and stops with a
// clear message if something would break the site. Runs first in "npm run build".
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const onVercel = Boolean(process.env.VERCEL);
const problems = [];
const where = onVercel
  ? "In Vercel: your project > Settings > Environment Variables. Then Deployments > ⋯ > Redeploy."
  : "Edit your .env.local file.";

// NEXTAUTH_URL (and NEXTAUTH_URL_INTERNAL) must be a full web address, or not exist at all.
for (const name of ["NEXTAUTH_URL", "NEXTAUTH_URL_INTERNAL"]) {
  const value = process.env[name];
  if (value === undefined) continue;
  if (value.trim() === "") {
    problems.push(
      `${name} exists but is empty. ${onVercel ? `Delete ${name} completely: Vercel doesn't need it.` : `Set it to http://localhost:3000 or remove the line.`}`
    );
    continue;
  }
  let url;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    problems.push(`${name} is not a valid web address: "${value}". ${onVercel ? `Delete ${name}: Vercel doesn't need it.` : "Use http://localhost:3000"}`);
    continue;
  }
  if (onVercel && ["localhost", "127.0.0.1"].includes(url.hostname)) {
    problems.push(`${name} points to ${url.host}, which only exists on your own computer. Delete ${name} in Vercel.`);
  }
}

if (!process.env.NEXTAUTH_SECRET || !process.env.NEXTAUTH_SECRET.trim()) {
  if (onVercel) problems.push("NEXTAUTH_SECRET is missing or empty. Add a long random text (see DEPLOYMENT.md, Part 5).");
  else console.warn("• NEXTAUTH_SECRET is not set. Logins won't work until you add it to .env.local.");
}

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL.trim()) {
  console.warn("• ADMIN_EMAIL is not set, so nobody becomes admin on sign-up. You can still use: npm run make-admin -- you@example.com");
}

if (problems.length) {
  console.error("\n✖ Settings problem" + (problems.length > 1 ? "s" : "") + " found before building:\n");
  problems.forEach((p, i) => console.error(`  ${i + 1}. ${p}`));
  console.error(`\n  How to fix: ${where}\n`);
  process.exit(1);
}

console.log("✓ Settings look good.");
