/**
 * Postgres client — reads DATABASE_URL from .env. Never hardcode secrets.
 */
require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Copy .env.example → .env and paste your Supabase Session pooler URI."
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
