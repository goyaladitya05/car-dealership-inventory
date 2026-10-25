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

  async createAdmin(email: string, passwordHash: string): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({ email, passwordHash, role: 'admin' })
      .returning();

    if (!user) {
      throw new Error('Failed to create admin');
    }

    return user;
  }

  async promoteToAdmin(id: string, passwordHash: string): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ role: 'admin', passwordHash })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new Error('Failed to promote admin');
    }

    return user;
  }
}
