import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import type { AppConfig } from '../config.js';
import { errorHandler } from './error-handler.js';
import { authenticate, requireRole } from './auth.js';

const config: AppConfig = {
  port: 3000,
  jwtSecret: 'a-secure-test-secret-with-32-characters',
  corsOrigin: 'http://localhost:5173',
};

function createTestApp() {
  const app = express();
  app.locals.config = config;
  app.get('/profile', authenticate, (request, response) => {
    response.json({ user: request.user });
  });
  app.get('/admin', authenticate, requireRole('admin'), (_request, response) =>
    response.json({ allowed: true }),
  );
  app.use(errorHandler);
  return app;
}

describe('authentication middleware', () => {
  it('attaches the authenticated user to the request', async () => {
    const token = jwt.sign({ role: 'user' }, config.jwtSecret, {
      subject: 'user-123',
      expiresIn: '1d',
    });

    const response = await request(createTestApp())
      .get('/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: { id: 'user-123', role: 'user' },
    });
  });

  it.each([undefined, 'Basic credentials', 'Bearer invalid-token'])(
    'rejects a missing or invalid bearer token',
    async (authorization) => {
      const pendingRequest = request(createTestApp()).get('/profile');
      if (authorization) {
        pendingRequest.set('Authorization', authorization);
      }

      const response = await pendingRequest;

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    },
  );

  it('rejects an authenticated user without the required role', async () => {
    const token = jwt.sign({ role: 'user' }, config.jwtSecret, {
      subject: 'user-123',
    });

    const response = await request(createTestApp())
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
  });

  it('allows an authenticated user with the required role', async () => {
    const token = jwt.sign({ role: 'admin' }, config.jwtSecret, {
      subject: 'admin-123',
    });

    const response = await request(createTestApp())
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ allowed: true });
  });
});
