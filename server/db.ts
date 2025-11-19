import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure SSL based on environment variable or connection string
// Set DATABASE_SSL=true in environment to enable SSL
const shouldUseSSL = process.env.DATABASE_SSL === 'true' || 
                     process.env.DATABASE_URL.includes('sslmode=require');

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSSL ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });

