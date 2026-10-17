import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { validateEnv } from '../config/env.schema.js';
import { poolConfig } from './connection.js';

try {
  process.loadEnvFile('.env');
} catch {}

const pool = new pg.Pool({ ...poolConfig(validateEnv(process.env), 'migration'), max: 1 });

try {
  await migrate(drizzle({ client: pool }), { migrationsFolder: './drizzle' });
  console.log('Migrations applied');
} finally {
  await pool.end();
}
