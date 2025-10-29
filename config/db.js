

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

function normalizeBoolean(value) {
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase();
  return ["true", "1", "yes", "on"].includes(v);
}

function buildSslOptions() {
  const rawDbSsl = process.env.DB_SSL;
  let sslEnabled = normalizeBoolean(rawDbSsl);

  // Heuristic: if connecting to Aiven and DB_SSL is not set, default to SSL on
  if (sslEnabled === undefined && typeof process.env.DB_HOST === "string") {
    if (process.env.DB_HOST.includes("aivencloud.com")) {
      sslEnabled = true;
    }
  }

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
  let sslMode = "disabled";
  if (dbConfig.ssl) {
    // mysql2 accepts boolean or object; we set object
    sslMode = dbConfig.ssl.ca ? "tls-verified" : "tls-insecure";
  }
  console.log("🔎 DB config:", {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    ssl: Boolean(dbConfig.ssl),
    sslMode,
    passwordProvided: Boolean(dbPassword),
    rawDbSsl,
  });
  await pool.query("SELECT 1");
  console.log("✅ MySQL pool initialized");
} catch (err) {
  console.error("❌ MySQL connection test failed:", err.message);
}

export default pool;