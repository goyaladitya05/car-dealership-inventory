import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Database } from './db/index.js';

const mocks = vi.hoisted(() => ({
  createDb: vi.fn(),
}));

vi.mock('./config.js', () => ({
  loadConfig: () => ({
    port: 3000,
    jwtSecret: 'a-secure-test-secret-with-32-characters',
    corsOrigin: 'http://localhost:5173',
    databaseUrl: 'postgres://example.test/dealership',
  }),
}));

vi.mock('./db/index.js', () => ({ createDb: mocks.createDb }));

describe('Express entrypoint', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createDb.mockReset();
    mocks.createDb.mockResolvedValue({
      db: {} as Database,
      close: vi.fn(async () => undefined),
    });
  });

  it('lazily reuses the app and serves health checks', async () => {
    const { default: app } = await import('./app.js');

    expect(mocks.createDb).not.toHaveBeenCalled();

    const firstResponse = await request(app).get('/api/health');
    const secondResponse = await request(app).get('/api/health');

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body).toEqual({ status: 'ok' });
    expect(secondResponse.status).toBe(200);
    expect(mocks.createDb).toHaveBeenCalledTimes(1);
    expect(mocks.createDb).toHaveBeenCalledWith({
      databaseUrl: 'postgres://example.test/dealership',
    });
  });

  it('retries initialization after a failure', async () => {
    mocks.createDb.mockRejectedValueOnce(new Error('database unavailable'));
    const { default: app } = await import('./app.js');

    const failedResponse = await request(app).get('/api/health');
    const retriedResponse = await request(app).get('/api/health');

    expect(failedResponse.status).toBe(500);
    expect(retriedResponse.status).toBe(200);
    expect(retriedResponse.body).toEqual({ status: 'ok' });
    expect(mocks.createDb).toHaveBeenCalledTimes(2);
  });
});
