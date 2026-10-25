import cors from 'cors';
import express from 'express';

import type { AppConfig } from './config.js';
import type { Database } from './db/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { healthRouter } from './routes/health-routes.js';

export interface AppDependencies {
  db: Database;
  config: AppConfig;
}

export function createApp(dependencies: AppDependencies) {
  const app = express();

  app.disable('x-powered-by');
  app.locals.db = dependencies.db;
  app.locals.config = dependencies.config;

  app.use(cors({ origin: dependencies.config.corsOrigin }));
  app.use(express.json());

  app.use('/api/health', healthRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
