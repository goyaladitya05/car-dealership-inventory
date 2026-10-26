import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Database } from '../src/db/index.js';

const mocks = vi.hoisted(() => ({
  createDb: vi.fn(async () => ({
    db: {} as Database,
    close: vi.fn(async () => undefined),
  })),
}));

vi.mock('../src/config.js', () => ({
  loadConfig: () => ({
    port: 3000,
    jwtSecret: 'a-secure-test-secret-with-32-characters',
    corsOrigin: 'http://localhost:5173',
    databaseUrl: 'postgres://example.test/dealership',
  }),
}));

vi.mock('../src/db/index.js', () => ({ createDb: mocks.createDb }));

import handler from './index.js';

describe('Vercel handler', () => {
  beforeEach(() => {
    mocks.createDb.mockClear();
  });

  it('lazily reuses the app and serves health checks', async () => {
    expect(mocks.createDb).not.toHaveBeenCalled();

    const firstResponse = await request(handler).get('/api/health');
    const secondResponse = await request(handler).get('/api/health');

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body).toEqual({ status: 'ok' });
    expect(secondResponse.status).toBe(200);
    expect(mocks.createDb).toHaveBeenCalledTimes(1);
    expect(mocks.createDb).toHaveBeenCalledWith({
      databaseUrl: 'postgres://example.test/dealership',
    });
  });
});
