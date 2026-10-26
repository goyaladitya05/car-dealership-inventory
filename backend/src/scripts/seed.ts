import 'dotenv/config';

import { z } from 'zod';

import { loadConfig } from '../config.js';
import { createDb } from '../db/index.js';
import { seedDemoData } from '../services/demo-seeder.js';

const seedConfigSchema = z.object({
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(8),
  DEMO_USER_EMAIL: z.email().default('demo@example.com'),
  DEMO_USER_PASSWORD: z.string().min(8).default('demo-password'),
});

const config = loadConfig();
const seedConfig = seedConfigSchema.parse(process.env);
const connection = await createDb(
  config.databaseUrl ? { databaseUrl: config.databaseUrl } : {},
);

try {
  await seedDemoData(connection.db, {
    adminEmail: seedConfig.ADMIN_EMAIL,
    adminPassword: seedConfig.ADMIN_PASSWORD,
    demoUserEmail: seedConfig.DEMO_USER_EMAIL,
    demoUserPassword: seedConfig.DEMO_USER_PASSWORD,
  });
  console.log('Demo data ready');
} finally {
  await connection.close();
}
