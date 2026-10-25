import type {
  CreateVehicleInput,
  Vehicle,
  VehicleRepository,
  VehicleSearch,
} from '../repositories/vehicle-repository.js';

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
}
