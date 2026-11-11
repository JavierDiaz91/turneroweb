import { Pool } from 'pg';
const globalForDb = globalThis as unknown as { renaserPool?: Pool };
export const pool = globalForDb.renaserPool ?? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 });
if (process.env.NODE_ENV !== 'production') globalForDb.renaserPool = pool;
