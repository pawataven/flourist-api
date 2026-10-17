import { readFileSync } from 'node:fs';
import type { ConnectionOptions } from 'node:tls';
import type { PoolConfig } from 'pg';
import type { Env } from '../config/env.schema.js';

type DatabaseEnv = Pick<
  Env,
  'DATABASE_URL' | 'DATABASE_MIGRATION_URL' | 'DATABASE_SSL' | 'DATABASE_SSL_CA' | 'SERVICE_NAME'
>;

export function sslOptions(env: DatabaseEnv): ConnectionOptions | undefined {
  if (!env.DATABASE_SSL) return undefined;
  const ca = readCa(env.DATABASE_SSL_CA);
  return ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false };
}

export function poolConfig(env: DatabaseEnv, purpose: 'app' | 'migration'): PoolConfig {
  const url =
    purpose === 'migration' ? (env.DATABASE_MIGRATION_URL ?? env.DATABASE_URL) : env.DATABASE_URL;
  return {
    connectionString: withoutSslMode(url),
    ssl: sslOptions(env),
    application_name: `${env.SERVICE_NAME}${purpose === 'migration' ? '-migrate' : ''}`,
  };
}

function readCa(value: string): string | undefined {
  if (!value) return undefined;
  if (value.includes('-----BEGIN')) return value.replace(/\\n/g, '\n');
  return readFileSync(value, 'utf8');
}

// pg lets `sslmode` in the URL override `ssl` and treats `require` as verify-full, which fails on Supabase.
function withoutSslMode(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete('sslmode');
  return parsed.toString();
}
