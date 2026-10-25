import type {
  CreateVehicleInput,
  Vehicle,
  VehicleRepository,
} from '../repositories/vehicle-repository.js';

export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  create(input: CreateVehicleInput): Promise<Vehicle> {
    return this.vehicles.create(input);
  }

  list(): Promise<Vehicle[]> {
    return this.vehicles.findAll();
  }
}
