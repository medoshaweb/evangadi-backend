import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

function normalizeBoolean(value) {
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase();
  return ["true", "1", "yes", "on"].includes(v);
}

const sslEnabled = normalizeBoolean(process.env.DB_SSL) ?? (process.env.DB_HOST?.includes("aivencloud.com") ? true : false);
const sslOptions = sslEnabled ? { rejectUnauthorized: false } : undefined;

const dbPassword = process.env.DB_PASSWORD ?? process.env.DB_PASS;

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: dbPassword,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  ssl: sslOptions,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 15000,
  queueLimit: 0,
});

console.log("🔎 DB config:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  database: process.env.DB_NAME,
  ssl: Boolean(sslOptions),
  passwordProvided: Boolean(dbPassword),
});

export default db;

