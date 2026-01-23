// db.ts
// ----------------------------
// ✅ Load environment variables BEFORE importing this file in index.ts
// ----------------------------

import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

console.log(`[DB] Checking environment variables: DATABASE_URL is ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database?',
  );
}

// Determine if we need SSL based on the database URL
const dbUrl = process.env.DATABASE_URL;
// Clean the URL to remove sslmode parameters that might conflict with our explicit config
const cleanDbUrl = dbUrl.replace(/[?&]sslmode=[^&]+/, "").replace(/\?$/, "");

const isRemoteDB = dbUrl.includes("supabase.com") || dbUrl.includes("neon.tech") || dbUrl.includes("render.com") || dbUrl.includes("pooler.");
const needsSSL = process.env.NODE_ENV === "production" || isRemoteDB;

console.log(`[DB] Database Configuration:
  - URL: ${cleanDbUrl.replace(/:[^:@]*@/, ":***@")}
  - SSL Required: ${needsSSL}
  - Remote DB: ${isRemoteDB}
`);

export const pool = new Pool({
  connectionString: cleanDbUrl,
  ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool, { schema });
