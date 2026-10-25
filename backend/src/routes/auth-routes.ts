import { Router } from 'express';

import type { AuthController } from '../controllers/auth-controller.js';

export function createAuthRouter(controller: AuthController) {
  const router = Router();

  router.post('/register', controller.register);

  return router;
}
