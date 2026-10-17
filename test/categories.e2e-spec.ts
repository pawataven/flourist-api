import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { createTestApp, isDatabaseReachable } from './utils.js';

const dbReady = await isDatabaseReachable();

describe.runIf(dbReady)('Categories (e2e, needs Postgres)', () => {
  let app: INestApplication<App>;
  const slug = `e2e-${Date.now()}`;
  let id: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (id) await request(app.getHttpServer()).delete(`/api/v1/categories/${id}`);
    await app.close();
  });

  it('GET /api/health/ready reports the database up', async () => {
    const res = await request(app.getHttpServer()).get('/api/health/ready').expect(200);
    expect(res.body.info.database.status).toBe('up');
  });

  it('creates, reads, updates and deletes a category', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/api/v1/categories')
      .send({ name: 'E2E Bouquets', slug })
      .expect(201);
    id = created.body.id;
    expect(created.body).toMatchObject({ name: 'E2E Bouquets', slug, description: null });

    await request(server)
      .post('/api/v1/categories')
      .send({ name: 'Duplicate', slug })
      .expect(409)
      .expect((res) => expect(res.body.code).toBe('CONFLICT'));

    const list = await request(server)
      .get('/api/v1/categories')
      .query({ search: slug, limit: 5 })
      .expect(200);
    expect(list.body.meta).toMatchObject({ page: 1, limit: 5, total: 1 });

    await request(server)
      .patch(`/api/v1/categories/${id}`)
      .send({ description: 'Updated' })
      .expect(200)
      .expect((res) => expect(res.body.description).toBe('Updated'));

    await request(server).delete(`/api/v1/categories/${id}`).expect(204);
    await request(server).get(`/api/v1/categories/${id}`).expect(404);
    id = '';
  });
});
