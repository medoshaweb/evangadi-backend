// import mysql from "mysql2/promise";
// import dotenv from "dotenv";
// dotenv.config();

// const shouldUseSSL =
//   typeof process.env.DB_SSL === "string"
//     ? process.env.DB_SSL.toLowerCase() === "true"
//     : false;
// const sslOptions = shouldUseSSL
//   ? { minVersion: "TLSv1.2", rejectUnauthorized: false }
//   : undefined;

//   const dbConfig = {
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
//   ssl: sslOptions,
//   waitForConnections: true,
//   connectionLimit: 10,
//   connectTimeout: 15000,
//   queueLimit: 0,
// };

// const db = mysql.createPool(dbConfig);

// try {
//   // Basic diagnostics to help troubleshoot connectivity
//   console.log(
//     "🔎 DB config:",
//     {
//       host: dbConfig.host,
//       port: dbConfig.port,
//       database: dbConfig.database,
//       ssl: Boolean(dbConfig.ssl),
//     }
//   );
//   // Lightweight query to validate that we are actually connected to a MySQL server
//   await db.query("SELECT 1");
//   console.log("✅ MySQL pool initialized");
// } catch (err) {
//   console.error("❌ MySQL connection test failed:", err.message);
// }
// export default db;

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

function buildSslOptions() {
  const sslEnabled =
    typeof process.env.DB_SSL === "string"
      ? process.env.DB_SSL.toLowerCase() === "true"
      : false;

  if (!sslEnabled) return undefined;

  const caPath = process.env.DB_SSL_CA;
  if (caPath) {
    const absoluteCaPath = path.isAbsolute(caPath)
      ? caPath
      : path.join(process.cwd(), caPath);
    if (fs.existsSync(absoluteCaPath)) {
      return { minVersion: "TLSv1.2", ca: fs.readFileSync(absoluteCaPath) };
    }
    console.warn(
      `⚠️  DB_SSL_CA file not found at ${absoluteCaPath}. Proceeding without CA; certificate verification will be disabled.`
    );
  }
  // Fallback: enable TLS without CA to avoid plaintext connection to TLS-required hosts
  return { minVersion: "TLSv1.2", rejectUnauthorized: false };
}

const dbPassword = process.env.DB_PASSWORD ?? process.env.DB_PASS;
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: dbPassword,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  ssl: buildSslOptions(),
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 15000,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

try {
  console.log("🔎 DB config:", {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    ssl: Boolean(dbConfig.ssl),
    passwordProvided: Boolean(dbPassword),
  });
  await pool.query("SELECT 1");
  console.log("✅ MySQL pool initialized");
} catch (err) {
  console.error("❌ MySQL connection test failed:", err.message);
}

export default pool;