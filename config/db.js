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

  if (sslEnabled === undefined && typeof process.env.DB_HOST === "string") {
    if (process.env.DB_HOST.includes("aivencloud.com")) {
      sslEnabled = true;
    }
  }

  if (!sslEnabled) return { enabled: false, options: undefined, mode: "disabled", rawDbSsl };

  const caPath = process.env.DB_SSL_CA;
  if (caPath) {
    const absoluteCaPath = path.isAbsolute(caPath) ? caPath : path.join(process.cwd(), caPath);
    if (fs.existsSync(absoluteCaPath)) {
      return {
        enabled: true,
        options: { minVersion: "TLSv1.2", ca: fs.readFileSync(absoluteCaPath) },
        mode: "tls-verified",
        rawDbSsl,
      };
    }
    console.warn(`⚠️  DB_SSL_CA file not found at ${absoluteCaPath}. Proceeding without CA; certificate verification will be disabled.`);
  }
  return {
    enabled: true,
    options: { minVersion: "TLSv1.2", rejectUnauthorized: false },
    mode: "tls-insecure",
    rawDbSsl,
  };
}

const { enabled: sslEnabled, options: sslOptions, mode: sslMode, rawDbSsl } = buildSslOptions();

  const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  ssl: sslOptions,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 15000,
  queueLimit: 0,
};

const db = mysql.createPool(dbConfig);

try {
  // Basic diagnostics to help troubleshoot connectivity
  console.log("🔎 DB config:", {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    ssl: Boolean(dbConfig.ssl),
    sslMode,
    rawDbSsl,
  });
  // Lightweight query to validate that we are actually connected to a MySQL server
  await db.query("SELECT 1");
  console.log("✅ MySQL pool initialized");
} catch (err) {
  console.error("❌ MySQL connection test failed:", err.message);
}
export default db;

