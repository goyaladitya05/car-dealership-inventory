import type {
  CreateVehicleInput,
  Vehicle,
  VehicleRepository,
  VehicleSearch,
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
}
