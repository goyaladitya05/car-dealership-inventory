import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import type { DatabaseConnection } from './db/index.js';
import { createTestDb } from './db/testing.js';
import { errorHandler } from './middleware/error-handler.js';

const config = {
  port: 3000,
  jwtSecret: 'a-secure-test-secret-with-32-characters',
  corsOrigin: 'http://localhost:5173',
};

describe('application', () => {
  let connection: DatabaseConnection;

  beforeAll(async () => {
    connection = await createTestDb();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('reports its health', async () => {
    const response = await request(
      createApp({ db: connection.db, config }),
    ).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns JSON for an unknown route', async () => {
    const response = await request(
      createApp({ db: connection.db, config }),
    ).get('/api/missing');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not Found' });
  });

  it('hides unexpected error details', async () => {
    const app = express();
    app.get('/error', () => {
      throw new Error('sensitive details');
    });
    app.use(errorHandler);

    const response = await request(app).get('/error');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });
});
