import { apiRequest } from './api-client';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFilters {
  make?: string | undefined;
  model?: string | undefined;
  category?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
}

export interface VehicleInput {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

export type VehicleUpdate = Partial<VehicleInput>;

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

export function createVehicle(input: VehicleInput, token: string) {
  return apiRequest<Vehicle>('/api/vehicles', {
    method: 'POST',
    body: input,
    token,
  });
}

export function updateVehicle(id: string, input: VehicleUpdate, token: string) {
  return apiRequest<Vehicle>(`/api/vehicles/${id}`, {
    method: 'PUT',
    body: input,
    token,
  });
}

export function removeVehicle(id: string, token: string) {
  return apiRequest<void>(`/api/vehicles/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function restockVehicle(id: string, quantity: number, token: string) {
  return apiRequest<Vehicle>(`/api/vehicles/${id}/restock`, {
    method: 'POST',
    body: { quantity },
    token,
  });
}
