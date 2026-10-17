import { defineConfig } from 'drizzle-kit';
import { poolConfig } from './src/database/connection.js';

try {
  process.loadEnvFile('.env');
} catch {}

const { connectionString, ssl } = poolConfig(
  {
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/postgres',
    DATABASE_MIGRATION_URL: process.env.DATABASE_MIGRATION_URL,
    DATABASE_SSL: process.env.DATABASE_SSL !== 'false',
    DATABASE_SSL_CA: process.env.DATABASE_SSL_CA ?? '',
    SERVICE_NAME: 'drizzle-kit',
  },
  'migration',
);
const url = new URL(connectionString!);

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1) || 'postgres',
    ssl: ssl ?? false,
  },
  schemaFilter: ['public'],
  strict: true,
  verbose: true,
});
