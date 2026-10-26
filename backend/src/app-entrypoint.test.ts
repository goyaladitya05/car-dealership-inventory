import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Database } from './db/index.js';

const mocks = vi.hoisted(() => ({
  createDb: vi.fn(async () => ({
    db: {} as Database,
    close: vi.fn(async () => undefined),
  })),
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

import app from './app.js';

describe('Express entrypoint', () => {
  beforeEach(() => {
    mocks.createDb.mockClear();
  });

  it('lazily reuses the app and serves health checks', async () => {
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
});
