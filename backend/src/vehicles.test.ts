import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import type { DatabaseConnection } from './db/index.js';
import { createTestDb } from './db/testing.js';

const config = {
  port: 3000,
  jwtSecret: 'a-secure-test-secret-with-32-characters',
  corsOrigin: 'http://localhost:5173',
};

function tokenFor(role: 'user' | 'admin') {
  return jwt.sign({ role }, config.jwtSecret, {
    subject: `${role}-123`,
    expiresIn: '1d',
  });
}

describe('POST /api/vehicles', () => {
  let connection: DatabaseConnection;

  beforeAll(async () => {
    connection = await createTestDb();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('creates a vehicle as an admin and defaults quantity to zero', async () => {
    const response = await request(createApp({ db: connection.db, config }))
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 32999.5,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 32999.5,
      quantity: 0,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(typeof response.body.price).toBe('number');
  });

  it.each([
    [{ model: 'Camry', category: 'Sedan', price: 10 }, 'make'],
    [{ make: 'Toyota', category: 'Sedan', price: 10 }, 'model'],
    [{ make: 'Toyota', model: 'Camry', price: 10 }, 'category'],
    [{ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 0 }, 'price'],
    [
      {
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 10,
        quantity: -1,
      },
      'quantity',
    ],
    [
      {
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 10,
        quantity: 1.5,
      },
      'quantity',
    ],
  ])('rejects invalid vehicle data', async (body, field) => {
    const response = await request(createApp({ db: connection.db, config }))
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: [field] })]),
    );
  });

  it('requires authentication', async () => {
    const response = await request(createApp({ db: connection.db, config }))
      .post('/api/vehicles')
      .send({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 10 });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('requires the admin role', async () => {
    const response = await request(createApp({ db: connection.db, config }))
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tokenFor('user')}`)
      .send({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 10 });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
  });
});
