import 'dotenv/config';

import { migrateDatabase } from '../db/index.js';

await migrateDatabase();
console.log('Database migrations complete');
