import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { REQUEST_ID_HEADER } from './common/index.js';
import { AppConfigService } from './config/index.js';

export function configureApp(app: INestApplication): void {
  const config = app.get(AppConfigService);
  const express = app as NestExpressApplication;

  if (config.get('TRUST_PROXY')) express.set('trust proxy', 1);
  express.disable('x-powered-by');

  app.use(helmet());
  app.use(compression());

  const origins = config.get('CORS_ORIGINS');
  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    credentials: true,
    exposedHeaders: [REQUEST_ID_HEADER],
  });

  app.setGlobalPrefix(config.get('API_PREFIX'));
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.enableShutdownHooks();

  if (config.get('SWAGGER_ENABLED')) setupSwagger(app, config);
}

function setupSwagger(app: INestApplication, config: AppConfigService): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Flourist API')
      .setDescription('REST API for the Flourist storefront and back office')
      .setVersion(process.env.npm_package_version ?? '1.0.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup(`${config.get('API_PREFIX')}/${config.get('SWAGGER_PATH')}`, app, document, {
    jsonDocumentUrl: `${config.get('API_PREFIX')}/${config.get('SWAGGER_PATH')}/json`,
  });
}
