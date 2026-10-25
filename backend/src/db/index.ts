import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as createNodePostgresDb } from 'drizzle-orm/node-postgres';
import { migrate as migrateNodePostgres } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as createPgliteDb } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { Pool } from 'pg';

import * as schema from './schema.js';

const migrationsFolder = fileURLToPath(
  new URL('../../drizzle', import.meta.url),
);

export type Database =
  | ReturnType<typeof createNodePostgresDb<typeof schema>>
  | ReturnType<typeof createPgliteDb<typeof schema>>;

export interface DatabaseConnection {
  db: Database;
  close: () => Promise<void>;
}

interface CreateDbOptions {
  databaseUrl?: string;
  dataDir?: string;
}

function createPostgresPool(databaseUrl: string) {
  const hostname = new URL(databaseUrl).hostname;
  const usesNeon = hostname === 'neon.tech' || hostname.endsWith('.neon.tech');

  return new Pool({
    connectionString: databaseUrl,
    max: 2,
    ...(usesNeon ? { ssl: true } : {}),
  });
}

export async function createDb(
  options: CreateDbOptions = {},
): Promise<DatabaseConnection> {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;

  if (databaseUrl) {
    const client = createPostgresPool(databaseUrl);
    const db = createNodePostgresDb(client, { schema });

    return { db, close: () => client.end() };
  }

  const client = new PGlite(options.dataDir ?? './.data');
  const db = createPgliteDb(client, { schema });

  await migratePglite(db, { migrationsFolder });

  return { db, close: () => client.close() };
}

export async function migrateDatabase(
  options: CreateDbOptions = {},
): Promise<void> {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;

  if (databaseUrl) {
    const client = createPostgresPool(databaseUrl);
    const db = createNodePostgresDb(client, { schema });

    try {
      await migrateNodePostgres(db, { migrationsFolder });
    } finally {
      await client.end();
    }
    return;
  }

  const client = new PGlite(options.dataDir ?? './.data');
  const db = createPgliteDb(client, { schema });

  try {
    await migratePglite(db, { migrationsFolder });
  } finally {
    await client.close();
  }
}
