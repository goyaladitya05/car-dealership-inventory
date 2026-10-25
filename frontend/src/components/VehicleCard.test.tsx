import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Vehicle } from '../lib/vehicles-api';
import { VehicleCard } from './VehicleCard';

const vehicle: Vehicle = {
  id: 'vehicle-1',
  make: 'Tata',
  model: 'Nexon',
  category: 'SUV',
  price: 32999.5,
  quantity: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function VehicleCardHarness({ initialVehicle = vehicle }) {
  const [currentVehicle, setCurrentVehicle] = useState(initialVehicle);

  return (
    <VehicleCard
      vehicle={currentVehicle}
      token="signed-token"
      onPurchased={setCurrentVehicle}
    />
  );
}

describe('VehicleCard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats vehicle details and disables purchase when sold out', () => {
    render(<VehicleCardHarness initialVehicle={{ ...vehicle, quantity: 0 }} />);

    expect(screen.getByRole('heading', { name: 'Tata Nexon' })).toBeVisible();
    expect(screen.getByText('$32,999.50')).toBeVisible();
    expect(screen.getByText('Out of stock')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
  });

  it('purchases one vehicle and updates its quantity in place', async () => {
    const updatedVehicle = { ...vehicle, quantity: 2 };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(updatedVehicle), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(<VehicleCardHarness />);

    await userEvent.click(screen.getByRole('button', { name: 'Purchase' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/vehicles/vehicle-1/purchase',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ quantity: 1 }),
      }),
    );
    expect(await screen.findByText('2 units available')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Purchase complete');
  });

  it('shows an inline error when purchase fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Insufficient stock' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(<VehicleCardHarness />);

    await userEvent.click(screen.getByRole('button', { name: 'Purchase' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Insufficient stock',
    );
    expect(screen.getByText('3 units available')).toBeVisible();
  });
});
