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
const updateVehicleSchema = createVehicleSchema.partial().extend({
  quantity: z.number().int().nonnegative().optional(),
});
const purchaseVehicleSchema = z.object({
  quantity: z.number().int().positive().default(1),
});

const optionalPrice = z.preprocess(
  (value) => (value === '' ? Number.NaN : value),
  z.coerce.number().nonnegative().optional(),
);

const searchVehicleSchema = z
  .object({
    make: z.string().optional(),
    model: z.string().optional(),
    category: z.string().optional(),
    minPrice: optionalPrice,
    maxPrice: optionalPrice,
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    {
      message: 'Minimum price must not exceed maximum price',
      path: ['minPrice'],
    },
  );
const vehicleIdSchema = z.uuid();

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

  search: RequestHandler = async (request, response, next) => {
    try {
      const query = searchVehicleSchema.parse(request.query);
      response.json(await this.vehicleService.search(query));
    } catch (error) {
      next(error);
    }
  };

  getById: RequestHandler = async (request, response, next) => {
    try {
      const id = vehicleIdSchema.parse(request.params.id);
      response.json(await this.vehicleService.getById(id));
    } catch (error) {
      next(error);
    }
  };

  update: RequestHandler = async (request, response, next) => {
    try {
      const id = vehicleIdSchema.parse(request.params.id);
      const input = updateVehicleSchema.parse(request.body);
      response.json(await this.vehicleService.update(id, input));
    } catch (error) {
      next(error);
    }
  };

  purchase: RequestHandler = async (request, response, next) => {
    try {
      const id = vehicleIdSchema.parse(request.params.id);
      const { quantity } = purchaseVehicleSchema.parse(request.body);
      response.json(await this.vehicleService.purchase(id, quantity));
    } catch (error) {
      next(error);
    }
  };

  delete: RequestHandler = async (request, response, next) => {
    try {
      const id = vehicleIdSchema.parse(request.params.id);
      await this.vehicleService.delete(id);
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  };
}
