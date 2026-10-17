import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { createTestApp } from './utils.js';

describe('Health & platform (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health/live reports ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/health/live').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('echoes the incoming request id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health/live')
      .set('x-request-id', 'test-123')
      .expect(200);
    expect(res.headers['x-request-id']).toBe('test-123');
  });

  it('sets security headers', async () => {
    const res = await request(app.getHttpServer()).get('/api/health/live');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('returns the standard error shape for unknown routes', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/nope').expect(404);
    expect(res.body).toMatchObject({ statusCode: 404, code: 'NOT_FOUND', path: '/api/v1/nope' });
    expect(res.body.requestId).toBeDefined();
  });

  it('rejects invalid input before it reaches the database', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ name: '', unknown: true })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toEqual(
      expect.arrayContaining(['property unknown should not exist', 'name should not be empty']),
    );
  });

  it('serves the OpenAPI document', async () => {
    const res = await request(app.getHttpServer()).get('/api/docs/json').expect(200);
    expect(res.body.paths).toHaveProperty('/api/v1/categories');
  });
});
