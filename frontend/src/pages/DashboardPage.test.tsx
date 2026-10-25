import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import type { Vehicle } from '../lib/vehicles-api';
import { DashboardPage } from './DashboardPage';

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const vehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    make: 'Tata',
    model: 'Nexon',
    category: 'SUV',
    price: 30000,
    quantity: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'vehicle-2',
    make: 'Honda',
    model: 'City',
    category: 'Sedan',
    price: 20000,
    quantity: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'vehicle-3',
    make: 'Ford',
    model: 'Mustang',
    category: 'Coupe',
    price: 50000,
    quantity: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      token: 'signed-token',
      user: { id: 'user-1', email: 'driver@example.com', role: 'user' },
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('shows a loading skeleton while inventory is loading', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));

    renderDashboard();

    expect(screen.getByLabelText('Loading inventory')).toBeVisible();
  });

  it('loads vehicles and computes inventory summary values', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(vehicles));

    renderDashboard();

    expect(await screen.findByText('Tata Nexon')).toBeVisible();
    expect(screen.getByTestId('vehicles-in-stock')).toHaveTextContent('2');
    expect(screen.getByTestId('total-units')).toHaveTextContent('3');
    expect(screen.getByTestId('inventory-value')).toHaveTextContent(
      '$80,000.00',
    );
  });

  it('uses search when a filter is selected and lists loaded categories', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(vehicles))
      .mockResolvedValueOnce(jsonResponse([vehicles[0]]));
    renderDashboard();
    await screen.findByText('Tata Nexon');

    expect(screen.getByRole('option', { name: 'Sedan' })).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'SUV');

    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/vehicles/search?category=SUV',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer signed-token',
        }),
      }),
    );
    expect(await screen.findByText('Tata Nexon')).toBeVisible();
    expect(screen.queryByText('Honda City')).not.toBeInTheDocument();
  });

  it('shows an empty state when no vehicles match', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([]));

    renderDashboard();

    expect(await screen.findByText('No vehicles found')).toBeVisible();
  });

  it('shows the API error and can retry', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ error: 'Inventory unavailable' }, 503))
      .mockResolvedValueOnce(jsonResponse(vehicles));

    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Inventory unavailable',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Tata Nexon')).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
