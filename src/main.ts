import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule, ObserveInstrument } from './app.module.js';
import { configureApp } from './app.setup.js';
import { AppConfigService } from './config/index.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  configureApp(app);

  const config = app.get(AppConfigService);
  await app.listen(config.get('PORT'), config.get('HOST'));

  const url = await app.getUrl();
  const logger = app.get(Logger);
  logger.log(`${config.get('SERVICE_NAME')} listening on ${url}/${config.get('API_PREFIX')}`);
  if (config.get('SWAGGER_ENABLED')) {
    logger.log(`Swagger UI: ${url}/${config.get('API_PREFIX')}/${config.get('SWAGGER_PATH')}`);
  }
}
await bootstrap();
