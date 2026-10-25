import bcrypt from 'bcryptjs';

import type { Database } from '../db/index.js';
import { UserRepository } from '../repositories/user-repository.js';

export async function seedAdmin(
  db: Database,
  email: string,
  password: string,
): Promise<void> {
  const users = new UserRepository(db);
  const existingUser = await users.findByEmail(email);
  const passwordHash = await bcrypt.hash(password, 10);

  if (existingUser) {
    await users.promoteToAdmin(existingUser.id, passwordHash);
    return;
  }

  await users.createAdmin(email, passwordHash);
}
