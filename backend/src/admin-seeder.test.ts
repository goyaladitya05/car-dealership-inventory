import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseConnection } from './db/index.js';
import { users } from './db/schema.js';
import { createTestDb } from './db/testing.js';
import { seedAdmin } from './services/admin-seeder.js';

describe('admin seeding', () => {
  let connection: DatabaseConnection;

  beforeEach(async () => {
    connection = await createTestDb();
  });

  afterEach(async () => {
    await connection.close();
  });

  it('creates an admin with a hashed password', async () => {
    await seedAdmin(connection.db, 'admin@example.com', 'admin-password');

    const [admin] = await connection.db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@example.com'));

    expect(admin).toMatchObject({
      email: 'admin@example.com',
      role: 'admin',
    });
    expect(
      await bcrypt.compare('admin-password', admin?.passwordHash ?? ''),
    ).toBe(true);
  });

  it('promotes an existing user and updates the password', async () => {
    await connection.db.insert(users).values({
      email: 'existing@example.com',
      passwordHash: await bcrypt.hash('old-password', 10),
    });

    await seedAdmin(connection.db, 'existing@example.com', 'new-password');

    const [admin] = await connection.db
      .select()
      .from(users)
      .where(eq(users.email, 'existing@example.com'));

    expect(admin?.role).toBe('admin');
    expect(
      await bcrypt.compare('new-password', admin?.passwordHash ?? ''),
    ).toBe(true);
  });
});
