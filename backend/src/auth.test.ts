import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import type { DatabaseConnection } from './db/index.js';
import { users } from './db/schema.js';
import { createTestDb } from './db/testing.js';

const config = {
  port: 3000,
  jwtSecret: 'a-secure-test-secret-with-32-characters',
  corsOrigin: 'http://localhost:5173',
};

describe('POST /api/auth/register', () => {
  let connection: DatabaseConnection;

  beforeAll(async () => {
    connection = await createTestDb();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('registers a user and returns an authentication token', async () => {
    const response = await request(
      createApp({ db: connection.db, config }),
    )
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      email: 'new@example.com',
      role: 'user',
    });
    expect(response.body.user.id).toEqual(expect.any(String));
    expect(response.body.token).toEqual(expect.any(String));

    const payload = jwt.verify(response.body.token, config.jwtSecret);
    expect(payload).toMatchObject({
      sub: response.body.user.id,
      role: 'user',
    });

    const [storedUser] = await connection.db
      .select()
      .from(users)
      .where(eq(users.email, 'new@example.com'));
    expect(storedUser?.passwordHash).not.toBe('password123');
  });

  it.each([
    [{ email: 'invalid', password: 'password123' }, 'email'],
    [{ email: 'valid@example.com', password: 'short' }, 'password'],
  ])('rejects invalid registration data', async (body, field) => {
    const response = await request(
      createApp({ db: connection.db, config }),
    )
      .post('/api/auth/register')
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: [field] })]),
    );
  });

  it('rejects a duplicate email', async () => {
    const app = createApp({ db: connection.db, config });
    const credentials = {
      email: 'duplicate@example.com',
      password: 'password123',
    };

    expect((await request(app).post('/api/auth/register').send(credentials)).status).toBe(
      201,
    );
    const response = await request(app)
      .post('/api/auth/register')
      .send(credentials);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Email already registered' });
  });
});

describe('POST /api/auth/login', () => {
  let connection: DatabaseConnection;

  beforeAll(async () => {
    connection = await createTestDb();
    await request(createApp({ db: connection.db, config }))
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'password123' });
  });

  afterAll(async () => {
    await connection.close();
  });

  it('logs in with valid credentials', async () => {
    const response = await request(
      createApp({ db: connection.db, config }),
    )
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      token: expect.any(String),
      user: {
        id: expect.any(String),
        email: 'login@example.com',
        role: 'user',
      },
    });
  });

  it.each([
    { email: 'missing@example.com', password: 'password123' },
    { email: 'login@example.com', password: 'wrong-password' },
  ])('rejects incorrect credentials with a generic message', async (body) => {
    const response = await request(
      createApp({ db: connection.db, config }),
    )
      .post('/api/auth/login')
      .send(body);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid email or password' });
  });

  it('validates login data', async () => {
    const response = await request(
      createApp({ db: connection.db, config }),
    )
      .post('/api/auth/login')
      .send({ email: 'invalid', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details).toHaveLength(2);
  });
});
