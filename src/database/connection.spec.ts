import { poolConfig, sslOptions } from './connection.js';

const env = {
  DATABASE_URL: 'postgresql://postgres.ref:pw@aws-0-x.pooler.supabase.com:6543/postgres',
  DATABASE_MIGRATION_URL: 'postgresql://postgres.ref:pw@aws-0-x.pooler.supabase.com:5432/postgres',
  DATABASE_SSL: true,
  DATABASE_SSL_CA: '',
  SERVICE_NAME: 'flourist-api',
};

describe('database connection', () => {
  it('uses the transaction pooler for the app and the session pooler for migrations', () => {
    expect(poolConfig(env, 'app').connectionString).toContain(':6543/');
    expect(poolConfig(env, 'migration').connectionString).toContain(':5432/');
  });

  it('falls back to DATABASE_URL for migrations', () => {
    const config = poolConfig({ ...env, DATABASE_MIGRATION_URL: undefined }, 'migration');
    expect(config.connectionString).toContain(':6543/');
  });

  it('strips sslmode so it cannot override the ssl option', () => {
    const config = poolConfig(
      { ...env, DATABASE_URL: `${env.DATABASE_URL}?sslmode=require` },
      'app',
    );
    expect(config.connectionString).not.toContain('sslmode');
  });

  it('verifies the certificate only when a CA is given', () => {
    expect(sslOptions(env)).toEqual({ rejectUnauthorized: false });
    expect(sslOptions({ ...env, DATABASE_SSL_CA: '-----BEGIN CERTIFICATE-----\\nabc' })).toEqual({
      ca: '-----BEGIN CERTIFICATE-----\nabc',
      rejectUnauthorized: true,
    });
    expect(sslOptions({ ...env, DATABASE_SSL: false })).toBeUndefined();
  });
});
