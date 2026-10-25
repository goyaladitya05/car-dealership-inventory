import type { Database } from '../db/index.js';
import { vehicles } from '../db/schema.js';

type VehicleRow = typeof vehicles.$inferSelect;

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleInput {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

function toVehicle(row: VehicleRow): Vehicle {
  return { ...row, price: Number(row.price) };
}

export class VehicleRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateVehicleInput): Promise<Vehicle> {
    const [vehicle] = await this.db
      .insert(vehicles)
      .values({ ...input, price: input.price.toString() })
      .returning();

    if (!vehicle) {
      throw new Error('Failed to create vehicle');
    }

    return toVehicle(vehicle);
  }
}
