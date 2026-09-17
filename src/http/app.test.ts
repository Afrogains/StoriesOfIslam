import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('HTTP application', () => {
  it('reports liveness without depending on external services', async () => {
    const response = await request(createApp()).get('/health/live');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('reports dependency failures through readiness', async () => {
    const app = createApp({
      checks: {
        database: async () => undefined,
        storage: async () => {
          throw new Error('unavailable');
        },
      },
    });
    const response = await request(app).get('/health/ready');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 'degraded',
      checks: { database: 'ok', storage: 'error' },
    });
  });

  it('returns a stable error envelope for unknown routes', async () => {
    const response = await request(createApp()).get('/missing');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('not_found');
    expect(response.body.error.requestId).toBeTruthy();
  });
});
