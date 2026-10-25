import 'dotenv/config';

import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createDb } from './db/index.js';

const config = loadConfig();
const connection = await createDb(
  config.databaseUrl ? { databaseUrl: config.databaseUrl } : {},
);
const app = createApp({ db: connection.db, config });

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
