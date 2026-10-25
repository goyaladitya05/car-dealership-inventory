import 'dotenv/config';

import type { IncomingMessage, ServerResponse } from 'node:http';

import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createDb } from '../src/db/index.js';

async function initializeApp() {
  const config = loadConfig();
  const connection = await createDb(
    config.databaseUrl ? { databaseUrl: config.databaseUrl } : {},
  );

  return createApp({ db: connection.db, config });
}

let appPromise: ReturnType<typeof initializeApp> | undefined;

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  appPromise ??= initializeApp();
  const app = await appPromise;
  app(request, response);
}
