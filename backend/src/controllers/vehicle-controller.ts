import type { RequestHandler } from 'express';
import { z } from 'zod';

import type { VehicleService } from '../services/vehicle-service.js';

const createVehicleSchema = z.object({
  make: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(100),
  price: z.number().positive(),
  quantity: z.number().int().nonnegative().default(0),
});

export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  create: RequestHandler = async (request, response, next) => {
    try {
      const input = createVehicleSchema.parse(request.body);
      const vehicle = await this.vehicleService.create(input);

      response.status(201).json(vehicle);
    } catch (error) {
      next(error);
    }
  };

  list: RequestHandler = async (_request, response, next) => {
    try {
      response.json(await this.vehicleService.list());
    } catch (error) {
      next(error);
    }
  };
}
