import { afterEach, describe, expect, it, vi } from 'vitest';

import { listVehicles, purchaseVehicle, searchVehicles } from './vehicles-api';

const vehicle = {
  id: 'vehicle-1',
  make: 'Tata',
  model: 'Nexon',
  category: 'SUV',
  price: 1499000,
  quantity: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('vehicles API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists vehicles with authentication', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse([vehicle]));

    await expect(listVehicles('signed-token')).resolves.toEqual([vehicle]);
    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles', {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer signed-token',
      },
    });
  });

  it('searches with only populated filters', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse([vehicle]));

    await searchVehicles(
      {
        make: 'Tata Motors',
        model: '',
        category: 'SUV',
        minPrice: 1000000,
        maxPrice: undefined,
      },
      'signed-token',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/vehicles/search?make=Tata+Motors&category=SUV&minPrice=1000000',
      {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer signed-token',
        },
      },
    );
  });

  it('purchases a requested quantity and returns updated stock', async () => {
    const updatedVehicle = { ...vehicle, quantity: 1 };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(updatedVehicle));

    await expect(
      purchaseVehicle('vehicle-1', 2, 'signed-token'),
    ).resolves.toEqual(updatedVehicle);
    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles/vehicle-1/purchase', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer signed-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity: 2 }),
    });
  });
});
