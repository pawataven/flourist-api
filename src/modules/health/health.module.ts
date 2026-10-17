import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { DatabaseHealthIndicator } from './indicators/database.health.js';

@Module({
  imports: [TerminusModule.forRoot({ gracefulShutdownTimeoutMs: 5_000 })],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator],
})
export class HealthModule {}
