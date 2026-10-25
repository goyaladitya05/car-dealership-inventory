import cors from 'cors';
import express from 'express';

import type { AppConfig } from './config.js';
import { AuthController } from './controllers/auth-controller.js';
import type { Database } from './db/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { UserRepository } from './repositories/user-repository.js';
import { createAuthRouter } from './routes/auth-routes.js';
import { healthRouter } from './routes/health-routes.js';
import { AuthService } from './services/auth-service.js';

export interface AppDependencies {
  db: Database;
  config: AppConfig;
}

export function createApp(dependencies: AppDependencies) {
  const app = express();
  const userRepository = new UserRepository(dependencies.db);
  const authService = new AuthService(userRepository, dependencies.config);
  const authController = new AuthController(authService);

  app.disable('x-powered-by');
  app.locals.db = dependencies.db;
  app.locals.config = dependencies.config;

  app.use(cors({ origin: dependencies.config.corsOrigin }));
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', createAuthRouter(authController));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
