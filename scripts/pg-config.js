// Shared by the helper scripts (CommonJS). The app itself uses lib/db.js.
function pgConfig(rawUrl) {
  const url = new URL(rawUrl);
  const isLocal =
    ["localhost", "127.0.0.1", "::1"].includes(url.hostname) || process.env.DATABASE_SSL === "false";
  // node-postgres handles SSL through the "ssl" option below.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return {
    connectionString: url.toString(),
    ssl: isLocal ? false : { rejectUnauthorized: false },
  };
}
module.exports = { pgConfig };
