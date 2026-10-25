import 'dotenv/config';

import { z } from 'zod';

import { loadConfig } from '../config.js';
import { createDb } from '../db/index.js';
import { seedAdmin } from '../services/admin-seeder.js';

const adminCredentialsSchema = z.object({
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(8),
});

const config = loadConfig();
const credentials = adminCredentialsSchema.parse(process.env);
const connection = await createDb(
  config.databaseUrl ? { databaseUrl: config.databaseUrl } : {},
);

try {
  await seedAdmin(
    connection.db,
    credentials.ADMIN_EMAIL,
    credentials.ADMIN_PASSWORD,
  );
  console.log(`Admin ready: ${credentials.ADMIN_EMAIL}`);
} finally {
  await connection.close();
}
