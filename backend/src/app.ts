import cors from 'cors';
import express from 'express';

import type { AppConfig } from './config.js';
import { AuthController } from './controllers/auth-controller.js';
import { VehicleController } from './controllers/vehicle-controller.js';
import type { Database } from './db/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { UserRepository } from './repositories/user-repository.js';
import { VehicleRepository } from './repositories/vehicle-repository.js';
import { createAuthRouter } from './routes/auth-routes.js';
import { healthRouter } from './routes/health-routes.js';
import { createVehicleRouter } from './routes/vehicle-routes.js';
import { AuthService } from './services/auth-service.js';
import { VehicleService } from './services/vehicle-service.js';

export interface AppDependencies {
  db: Database;
  config: AppConfig;
}

export function createApp(dependencies: AppDependencies) {
  const app = express();
  const userRepository = new UserRepository(dependencies.db);
  const authService = new AuthService(userRepository, dependencies.config);
  const authController = new AuthController(authService);
  const vehicleRepository = new VehicleRepository(dependencies.db);
  const vehicleService = new VehicleService(vehicleRepository);
  const vehicleController = new VehicleController(vehicleService);

  app.disable('x-powered-by');
  app.locals.db = dependencies.db;
  app.locals.config = dependencies.config;

  app.use(cors({ origin: dependencies.config.corsOrigin }));
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', createAuthRouter(authController));
  app.use('/api/vehicles', createVehicleRouter(vehicleController));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
