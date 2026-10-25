import type {
  CreateVehicleInput,
  Vehicle,
  VehicleRepository,
  VehicleSearch,
  UpdateVehicleInput,
} from '../repositories/vehicle-repository.js';
import { AppError } from '../errors/app-error.js';

export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  create(input: CreateVehicleInput): Promise<Vehicle> {
    return this.vehicles.create(input);
  }

  list(): Promise<Vehicle[]> {
    return this.vehicles.findAll();
  }

  search(input: VehicleSearch): Promise<Vehicle[]> {
    return this.vehicles.search(input);
  }

  async getById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicles.findById(id);

    if (!vehicle) {
      throw new AppError(404, 'Vehicle not found');
    }

    return vehicle;
  }

  async update(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
    const vehicle = await this.vehicles.update(id, input);

    if (!vehicle) {
      throw new AppError(404, 'Vehicle not found');
    }

    return vehicle;
  }

  async purchase(id: string, quantity: number): Promise<Vehicle> {
    const vehicle = await this.vehicles.purchase(id, quantity);

    if (vehicle) {
      return vehicle;
    }

    if (!(await this.vehicles.findById(id))) {
      throw new AppError(404, 'Vehicle not found');
    }

    throw new AppError(409, 'Insufficient stock');
  }

  async delete(id: string): Promise<void> {
    if (!(await this.vehicles.delete(id))) {
      throw new AppError(404, 'Vehicle not found');
    }
  }
}
