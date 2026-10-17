try {
  process.loadEnvFile('.env');
} catch {}
process.env.NODE_ENV = 'test';

// Never run e2e (which writes rows) against the real Supabase DATABASE_URL.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.DATABASE_MIGRATION_URL = process.env.TEST_DATABASE_URL;
  process.env.DATABASE_SSL ??= 'false';
}
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
