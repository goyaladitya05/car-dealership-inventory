import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { type AppConfig, loadConfig } from './config.js';
import { AuthController } from './controllers/auth-controller.js';
import { VehicleController } from './controllers/vehicle-controller.js';
import { createDb, type Database } from './db/index.js';
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

async function initializeApp() {
  const config = loadConfig();
  const connection = await createDb(
    config.databaseUrl ? { databaseUrl: config.databaseUrl } : {},
  );

  return createApp({ db: connection.db, config });
}

let appPromise: ReturnType<typeof initializeApp> | undefined;
const app = express();

app.use(async (request, response, next) => {
  const pendingApp = (appPromise ??= initializeApp());

  try {
    const initializedApp = await pendingApp;
    initializedApp(request, response, next);
  } catch (error) {
    if (appPromise === pendingApp) {
      appPromise = undefined;
    }
    next(error);
  }
});

export default app;
