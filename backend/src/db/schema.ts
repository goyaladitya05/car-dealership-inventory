import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRole().default('user').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid().defaultRandom().primaryKey(),
    make: varchar({ length: 100 }).notNull(),
    model: varchar({ length: 100 }).notNull(),
    category: varchar({ length: 100 }).notNull(),
    price: numeric({ precision: 12, scale: 2 }).notNull(),
    quantity: integer().notNull(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [check('vehicles_quantity_non_negative', sql`${table.quantity} >= 0`)],
);
