import { eq } from 'drizzle-orm';

import type { Database } from '../db/index.js';
import { users } from '../db/schema.js';

export type User = typeof users.$inferSelect;

export class UserRepository {
  constructor(private readonly db: Database) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return user;
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({ email, passwordHash })
      .returning();

    if (!user) {
      throw new Error('Failed to create user');
    }

    return user;
  }
}
