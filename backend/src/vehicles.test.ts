import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import type { DatabaseConnection } from './db/index.js';
import { vehicles } from './db/schema.js';
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

describe('GET /api/vehicles', () => {
  let connection: DatabaseConnection;

  beforeAll(async () => {
    connection = await createTestDb();
    await connection.db.insert(vehicles).values([
      {
        make: 'Honda',
        model: 'Civic',
        category: 'Sedan',
        price: '25000.00',
        quantity: 2,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        make: 'Ford',
        model: 'Explorer',
        category: 'SUV',
        price: '48000.50',
        quantity: 1,
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ]);
  });

  afterAll(async () => {
    await connection.close();
  });

  it('lists vehicles by newest first with numeric prices', async () => {
    const response = await request(createApp({ db: connection.db, config }))
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${tokenFor('user')}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((vehicle: { make: string }) => vehicle.make)).toEqual([
      'Ford',
      'Honda',
    ]);
    expect(response.body[0]).toMatchObject({ price: 48000.5, quantity: 1 });
    expect(typeof response.body[0].price).toBe('number');
  });

  it('requires authentication', async () => {
    const response = await request(createApp({ db: connection.db, config })).get(
      '/api/vehicles',
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });
});

describe('GET /api/vehicles/search', () => {
  let connection: DatabaseConnection;

  beforeAll(async () => {
    connection = await createTestDb();
    await connection.db.insert(vehicles).values([
      {
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: '20000.00',
        quantity: 1,
      },
      {
        make: 'toyota',
        model: 'Corolla',
        category: 'sedan',
        price: '30000.00',
        quantity: 1,
      },
      {
        make: 'Ford',
        model: 'Model T',
        category: 'Classic',
        price: '15000.00',
        quantity: 1,
      },
    ]);
  });

  afterAll(async () => {
    await connection.close();
  });

  it.each([
    ['make=YOT', ['Toyota', 'toyota']],
    ['model=AM', ['Toyota']],
    ['category=SEDAN', ['Toyota', 'toyota']],
    ['category=dan', []],
    ['minPrice=20000&maxPrice=30000', ['Toyota', 'toyota']],
    [
      'make=toy&category=sedan&minPrice=25000&maxPrice=30000',
      ['toyota'],
    ],
  ])('filters vehicles with %s', async (query, expectedMakes) => {
    const response = await request(createApp({ db: connection.db, config }))
      .get(`/api/vehicles/search?${query}`)
      .set('Authorization', `Bearer ${tokenFor('user')}`);

    expect(response.status).toBe(200);
    expect(
      response.body.map((vehicle: { make: string }) => vehicle.make).sort(),
    ).toEqual([...expectedMakes].sort());
    for (const vehicle of response.body) {
      expect(typeof vehicle.price).toBe('number');
    }
  });

  it.each(['minPrice=invalid', 'maxPrice=invalid', 'minPrice=20&maxPrice=10'])(
    'rejects invalid search query %s',
    async (query) => {
      const response = await request(createApp({ db: connection.db, config }))
        .get(`/api/vehicles/search?${query}`)
        .set('Authorization', `Bearer ${tokenFor('user')}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    },
  );

  it('requires authentication', async () => {
    const response = await request(createApp({ db: connection.db, config })).get(
      '/api/vehicles/search?make=Toyota',
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });
});
