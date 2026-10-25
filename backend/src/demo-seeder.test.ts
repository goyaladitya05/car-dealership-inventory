import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseConnection } from './db/index.js';
import { users, vehicles } from './db/schema.js';
import { createTestDb } from './db/testing.js';
import { sampleVehicles, seedDemoData } from './services/demo-seeder.js';

describe('demo data seeding', () => {
  let connection: DatabaseConnection;

  beforeEach(async () => {
    connection = await createTestDb();
  });

  afterEach(async () => {
    await connection.close();
  });

  it('creates the users and sample vehicles idempotently', async () => {
    const options = {
      adminEmail: 'admin@example.com',
      adminPassword: 'admin-password',
      demoUserEmail: 'demo@example.com',
      demoUserPassword: 'demo-password',
    };

    await seedDemoData(connection.db, options);
    await seedDemoData(connection.db, options);

    const seededUsers = await connection.db.select().from(users);
    const seededVehicles = await connection.db.select().from(vehicles);
    const demoUser = seededUsers.find(
      (user) => user.email === options.demoUserEmail,
    );

    expect(seededUsers).toHaveLength(2);
    expect(demoUser?.role).toBe('user');
    expect(
      await bcrypt.compare(
        options.demoUserPassword,
        demoUser?.passwordHash ?? '',
      ),
    ).toBe(true);
    expect(seededVehicles).toHaveLength(sampleVehicles.length);
    expect(seededVehicles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          make: 'Porsche',
          model: '911 Carrera',
          category: 'Coupe',
          price: '114400.00',
          quantity: 3,
          imageUrl: expect.stringContaining('wikimedia.org'),
        }),
        expect.objectContaining({ make: 'Audi', quantity: 0 }),
      ]),
    );
  });

  it('does not add sample vehicles when inventory already exists', async () => {
    await connection.db.insert(vehicles).values({
      make: 'Existing',
      model: 'Vehicle',
      category: 'Sedan',
      price: '10000.00',
      quantity: 1,
    });

    await seedDemoData(connection.db, {
      adminEmail: 'admin@example.com',
      adminPassword: 'admin-password',
      demoUserEmail: 'demo@example.com',
      demoUserPassword: 'demo-password',
    });

    const inventory = await connection.db.select().from(vehicles);
    const [admin] = await connection.db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@example.com'));

    expect(inventory).toHaveLength(1);
    expect(inventory[0]?.make).toBe('Existing');
    expect(admin?.role).toBe('admin');
  });
});
