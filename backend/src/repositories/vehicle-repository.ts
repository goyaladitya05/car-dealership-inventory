import { and, desc, eq, gte, ilike, lte, sql } from 'drizzle-orm';

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

export interface VehicleSearch {
  make?: string | undefined;
  model?: string | undefined;
  category?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
}

export interface UpdateVehicleInput {
  make?: string | undefined;
  model?: string | undefined;
  category?: string | undefined;
  price?: number | undefined;
  quantity?: number | undefined;
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
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

  async findAll(): Promise<Vehicle[]> {
    const rows = await this.db
      .select()
      .from(vehicles)
      .orderBy(desc(vehicles.createdAt));

    return rows.map(toVehicle);
  }

  async search(input: VehicleSearch): Promise<Vehicle[]> {
    const conditions = [
      input.make === undefined
        ? undefined
        : ilike(vehicles.make, `%${escapeLike(input.make)}%`),
      input.model === undefined
        ? undefined
        : ilike(vehicles.model, `%${escapeLike(input.model)}%`),
      input.category === undefined
        ? undefined
        : eq(
            sql<string>`lower(${vehicles.category})`,
            input.category.toLowerCase(),
          ),
      input.minPrice === undefined
        ? undefined
        : gte(vehicles.price, input.minPrice.toString()),
      input.maxPrice === undefined
        ? undefined
        : lte(vehicles.price, input.maxPrice.toString()),
    ];
    const rows = await this.db
      .select()
      .from(vehicles)
      .where(and(...conditions))
      .orderBy(desc(vehicles.createdAt));

    return rows.map(toVehicle);
  }

  async findById(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await this.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id));

    return vehicle ? toVehicle(vehicle) : undefined;
  }

  async update(
    id: string,
    input: UpdateVehicleInput,
  ): Promise<Vehicle | undefined> {
    const { price, ...fields } = input;
    const [vehicle] = await this.db
      .update(vehicles)
      .set({
        ...fields,
        ...(price === undefined ? {} : { price: price.toString() }),
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning();

    return vehicle ? toVehicle(vehicle) : undefined;
  }

  async purchase(id: string, quantity: number): Promise<Vehicle | undefined> {
    const [vehicle] = await this.db
      .update(vehicles)
      .set({
        quantity: sql`${vehicles.quantity} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(and(eq(vehicles.id, id), gte(vehicles.quantity, quantity)))
      .returning();

    return vehicle ? toVehicle(vehicle) : undefined;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(vehicles)
      .where(eq(vehicles.id, id))
      .returning();

    return deleted.length > 0;
  }
}
