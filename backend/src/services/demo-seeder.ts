import bcrypt from 'bcryptjs';

import type { Database } from '../db/index.js';
import { vehicles } from '../db/schema.js';
import { UserRepository } from '../repositories/user-repository.js';
import { sampleVehicles } from '../scripts/sample-vehicles.js';
import { seedAdmin } from './admin-seeder.js';

export { sampleVehicles } from '../scripts/sample-vehicles.js';

interface DemoSeedOptions {
  adminEmail: string;
  adminPassword: string;
  demoUserEmail: string;
  demoUserPassword: string;
}

export async function seedDemoData(
  db: Database,
  options: DemoSeedOptions,
): Promise<void> {
  await seedAdmin(db, options.adminEmail, options.adminPassword);

  const users = new UserRepository(db);
  const demoUser = await users.findByEmail(options.demoUserEmail);
  if (!demoUser) {
    const passwordHash = await bcrypt.hash(options.demoUserPassword, 10);
    await users.create(options.demoUserEmail, passwordHash);
  }

  const [existingVehicle] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .limit(1);
  if (!existingVehicle) {
    await db.insert(vehicles).values([...sampleVehicles]);
  }
}
