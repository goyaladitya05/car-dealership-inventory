import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Vehicle } from '../lib/vehicles-api';
import { VehicleFormModal } from './VehicleFormModal';

const vehicle: Vehicle = {
  id: 'vehicle-1',
  make: 'Toyota',
  model: 'Camry',
  category: 'Sedan',
  price: 32000,
  quantity: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText('Make'), 'Toyota');
  await userEvent.type(screen.getByLabelText('Model'), 'Camry');
  await userEvent.type(screen.getByLabelText('Category'), 'Sedan');
  await userEvent.type(screen.getByLabelText('Price'), '32000');
  await userEvent.type(screen.getByLabelText('Quantity'), '3');
}

describe('VehicleFormModal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates fields with the backend vehicle rules', async () => {
    render(
      <VehicleFormModal
        token="signed-token"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(screen.getByText('Make is required')).toBeVisible();
    expect(screen.getByText('Model is required')).toBeVisible();
    expect(screen.getByText('Category is required')).toBeVisible();
    expect(screen.getByText('Price must be greater than 0')).toBeVisible();
    expect(
      screen.getByText('Quantity must be a whole number of 0 or more'),
    ).toBeVisible();

    await userEvent.type(screen.getByLabelText('Make'), 'a'.repeat(101));
    await userEvent.type(screen.getByLabelText('Model'), 'Camry');
    await userEvent.type(screen.getByLabelText('Category'), 'Sedan');
    await userEvent.type(screen.getByLabelText('Price'), '10');
    await userEvent.type(screen.getByLabelText('Quantity'), '1.5');
    await userEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(screen.getByText('Make must be 100 characters or less')).toBeVisible();
    expect(
      screen.getByText('Quantity must be a whole number of 0 or more'),
    ).toBeVisible();
  });

  it('creates a vehicle and reports it without reloading', async () => {
    const onSaved = vi.fn();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(vehicle, 201));
    render(
      <VehicleFormModal
        token="signed-token"
        onClose={vi.fn()}
        onSaved={onSaved}
      />,
    );

    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/vehicles',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          make: 'Toyota',
          model: 'Camry',
          category: 'Sedan',
          price: 32000,
          quantity: 3,
        }),
      }),
    );
    expect(onSaved).toHaveBeenCalledWith(vehicle);
  });

  it('submits only changed fields when editing', async () => {
    const updatedVehicle = { ...vehicle, model: 'Corolla' };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(updatedVehicle));
    render(
      <VehicleFormModal
        token="signed-token"
        vehicle={vehicle}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const modelInput = screen.getByLabelText('Model');
    await userEvent.clear(modelInput);
    await userEvent.type(modelInput, 'Corolla');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/vehicles/vehicle-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ model: 'Corolla' }),
      }),
    );
  });

  it('shows a server error and keeps the dialog open', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ error: 'Vehicle already exists' }, 409),
    );
    render(
      <VehicleFormModal
        token="signed-token"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vehicle already exists',
    );
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('focuses the first field and closes on Escape', async () => {
    const onClose = vi.fn();
    render(
      <VehicleFormModal
        token="signed-token"
        onClose={onClose}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Make')).toHaveFocus();
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });
});
