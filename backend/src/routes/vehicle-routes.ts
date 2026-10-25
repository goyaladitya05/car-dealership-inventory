import { Router } from 'express';

import type { VehicleController } from '../controllers/vehicle-controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export function createVehicleRouter(controller: VehicleController) {
  const router = Router();

  router.use(authenticate);
  router.get('/', controller.list);
  router.get('/search', controller.search);
  router.get('/:id', controller.getById);
  router.post('/', requireRole('admin'), controller.create);
  router.put('/:id', requireRole('admin'), controller.update);
  router.delete('/:id', requireRole('admin'), controller.delete);

  return router;
}
