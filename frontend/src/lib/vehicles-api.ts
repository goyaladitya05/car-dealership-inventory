import { apiRequest } from './api-client';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export function listVehicles(token: string) {
  return apiRequest<Vehicle[]>('/api/vehicles', { token });
}

export function searchVehicles(filters: VehicleFilters, token: string) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }

  return apiRequest<Vehicle[]>(`/api/vehicles/search?${query.toString()}`, {
    token,
  });
}

export function purchaseVehicle(id: string, quantity: number, token: string) {
  return apiRequest<Vehicle>(`/api/vehicles/${id}/purchase`, {
    method: 'POST',
    body: { quantity },
    token,
  });
}
