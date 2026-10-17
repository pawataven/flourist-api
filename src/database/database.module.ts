import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { AppConfigService } from '../config/index.js';
import { poolConfig } from './connection.js';
import { DATABASE, PG_POOL } from './database.constants.js';
import * as schema from './schema/index.js';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const pool = new pg.Pool({
          ...poolConfig(
            {
              DATABASE_URL: config.get('DATABASE_URL'),
              DATABASE_MIGRATION_URL: config.get('DATABASE_MIGRATION_URL'),
              DATABASE_SSL: config.get('DATABASE_SSL'),
              DATABASE_SSL_CA: config.get('DATABASE_SSL_CA'),
              SERVICE_NAME: config.get('SERVICE_NAME'),
            },
            'app',
          ),
          max: config.get('DATABASE_POOL_MAX'),
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 10_000,
        });
        // Supavisor closes idle connections; without a listener that error would crash the process.
        const logger = new Logger('DatabasePool');
        pool.on('error', (error) => logger.warn(`Idle client error: ${error.message}`));
        return pool;
      },
    },
    {
      provide: DATABASE,
      inject: [PG_POOL, AppConfigService],
      useFactory: (pool: pg.Pool, config: AppConfigService) =>
        drizzle({ client: pool, schema, logger: config.get('LOG_LEVEL') === 'debug' }),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
