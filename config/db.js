import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

function normalizeBoolean(value) {
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase();
  return ["true", "1", "yes", "on"].includes(v);
}

// Helper to clean env values (remove JavaScript-like syntax)
function cleanEnvValue(value, defaultValue = null) {
  if (!value) return defaultValue;
  // Remove JavaScript syntax like "value || fallback"
  const cleaned = value.split("||")[0].trim();
  return cleaned || defaultValue;
}

// Get database config with proper fallbacks
const dbHost = cleanEnvValue(process.env.DB_HOST, "localhost");
const dbUser = cleanEnvValue(process.env.DB_USER, "root");
const dbName = cleanEnvValue(process.env.DB_NAME, "evan_for");
const dbPort = process.env.DB_PORT 
  ? Number(cleanEnvValue(process.env.DB_PORT, "3306")) 
  : 3306;

const sslEnabled = normalizeBoolean(process.env.DB_SSL) ?? (dbHost.includes("aivencloud.com") ? true : false);
const sslOptions = sslEnabled ? { rejectUnauthorized: false } : undefined;

const dbPassword = cleanEnvValue(process.env.DB_PASSWORD) ?? cleanEnvValue(process.env.DB_PASS);

const db = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  ssl: sslOptions,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 15000,
  queueLimit: 0,
});

console.log("🔎 DB config:", {
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUser,
  ssl: Boolean(sslOptions),
  passwordProvided: Boolean(dbPassword),
});

export default db;

