import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { Brand } from '../components/Brand';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleFilters } from '../components/VehicleFilters';
import { VehicleFormModal } from '../components/VehicleFormModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  listVehicles,
  searchVehicles,
  type Vehicle,
  type VehicleFilters as Filters,
} from '../lib/vehicles-api';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function SummaryCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <Card className="relative min-h-36 overflow-hidden p-6">
      <div className="absolute -right-8 -top-10 size-28 rounded-full bg-periwinkle/30 blur-2xl" />
      <p className="relative text-xs font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p
        data-testid={testId}
        className="relative mt-7 font-display text-4xl leading-none tracking-[-0.025em] text-ink sm:text-5xl"
      >
        {value}
      </p>
    </Card>
  );
}

function LoadingInventory() {
  return (
    <div
      aria-label="Loading inventory"
      className="grid animate-pulse gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="min-h-72 rounded-[1.75rem] border border-white/80 bg-white/65 p-6 shadow-soft"
        >
          <div className="h-6 w-20 rounded-full bg-periwinkle/45" />
          <div className="mt-10 h-4 w-24 rounded bg-line/70" />
          <div className="mt-4 h-10 w-3/4 rounded bg-line/70" />
          <div className="mt-5 h-6 w-32 rounded bg-line/60" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { user, token, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [formVehicle, setFormVehicle] = useState<Vehicle | 'new'>();
  const requestId = useRef(0);

  const loadInventory = useCallback(
    async (nextFilters: Filters) => {
      if (!token) {
        return;
      }

      const currentRequest = ++requestId.current;
      setIsLoading(true);
      setError(undefined);

      try {
        const hasFilters = Object.keys(nextFilters).length > 0;
        const result = hasFilters
          ? await searchVehicles(nextFilters, token)
          : await listVehicles(token);

        if (currentRequest !== requestId.current) {
          return;
        }

        setVehicles(result);
        if (!hasFilters) {
          setCategories(
            [...new Set(result.map((vehicle) => vehicle.category))].sort(
              (left, right) => left.localeCompare(right),
            ),
          );
        }
      } catch (loadError) {
        if (currentRequest === requestId.current) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load inventory',
          );
        }
      } finally {
        if (currentRequest === requestId.current) {
          setIsLoading(false);
        }
      }
    },
    [token],
  );

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadInventory({}), 0);

    return () => clearTimeout(initialLoad);
  }, [loadInventory]);

  const summary = useMemo(
    () => ({
      inStock: vehicles.filter((vehicle) => vehicle.quantity > 0).length,
      units: vehicles.reduce((total, vehicle) => total + vehicle.quantity, 0),
      value: vehicles.reduce(
        (total, vehicle) => total + vehicle.price * vehicle.quantity,
        0,
      ),
    }),
    [vehicles],
  );

  function handleFilters(nextFilters: Filters) {
    setFilters(nextFilters);
    void loadInventory(nextFilters);
  }

  function handlePurchased(updatedVehicle: Vehicle) {
    setVehicles((currentVehicles) =>
      currentVehicles.map((vehicle) =>
        vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle,
      ),
    );
  }

  function handleSaved(savedVehicle: Vehicle) {
    setVehicles((currentVehicles) => {
      const exists = currentVehicles.some(
        (vehicle) => vehicle.id === savedVehicle.id,
      );

      return exists
        ? currentVehicles.map((vehicle) =>
            vehicle.id === savedVehicle.id ? savedVehicle : vehicle,
          )
        : [savedVehicle, ...currentVehicles];
    });
    setCategories((currentCategories) =>
      [...new Set([...currentCategories, savedVehicle.category])].sort(
        (left, right) => left.localeCompare(right),
      ),
    );
  }

  function handleDeleted(id: string) {
    setVehicles((currentVehicles) =>
      currentVehicles.filter((vehicle) => vehicle.id !== id),
    );
  }

  if (!token) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas px-4 pb-16 sm:px-6">
      <div className="dashboard-glow" aria-hidden="true" />
      <nav
        aria-hidden={Boolean(formVehicle)}
        className="relative z-10 mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-3 py-4"
      >
        <Brand />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">{user?.email}</p>
            <p className="text-xs text-muted">Dealership account</p>
          </div>
          {user?.role === 'admin' ? (
            <span className="rounded-full bg-periwinkle/55 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-indigo-900">
              Admin
            </span>
          ) : null}
          <Button
            variant="secondary"
            onClick={logout}
            className="min-h-10 px-4"
          >
            Log out
          </Button>
        </div>
      </nav>

      <div
        aria-hidden={Boolean(formVehicle)}
        className="relative z-10 mx-auto max-w-7xl pt-12 sm:pt-20"
      >
        <header>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-indigo-700">
            Inventory workspace
          </p>
          <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="max-w-3xl font-display text-5xl leading-[0.94] tracking-[-0.04em] text-ink sm:text-7xl">
                Inventory overview
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted">
                Find the right vehicle, track available stock and complete a
                purchase from one focused workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              {user?.role === 'admin' && !formVehicle ? (
                <Button onClick={() => setFormVehicle('new')}>
                  Add vehicle
                </Button>
              ) : null}
              <p className="text-sm text-muted">
                {vehicles.length}{' '}
                {vehicles.length === 1 ? 'model' : 'models'}
                {' shown'}
              </p>
            </div>
          </div>
        </header>

        <section
          aria-label="Inventory summary"
          className="mt-10 grid gap-4 sm:grid-cols-3"
        >
          <SummaryCard
            label="Vehicles in stock"
            value={String(summary.inStock)}
            testId="vehicles-in-stock"
          />
          <SummaryCard
            label="Total units"
            value={String(summary.units)}
            testId="total-units"
          />
          <SummaryCard
            label="Inventory value"
            value={currencyFormatter.format(summary.value)}
            testId="inventory-value"
          />
        </section>

        <section aria-labelledby="available-vehicles" className="mt-12">
          <div className="mb-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-indigo-700">
              Browse stock
            </p>
            <h2
              id="available-vehicles"
              className="mt-2 font-display text-4xl tracking-[-0.03em] text-ink"
            >
              Available vehicles
            </h2>
          </div>

          <VehicleFilters categories={categories} onChange={handleFilters} />

          <div className="mt-7">
            {isLoading ? <LoadingInventory /> : null}

            {!isLoading && error ? (
              <Card className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                  Could not load inventory
                </p>
                <p role="alert" className="mt-3 text-lg text-ink">
                  {error}
                </p>
                <Button
                  className="mt-6"
                  onClick={() => void loadInventory(filters)}
                >
                  Try again
                </Button>
              </Card>
            ) : null}

            {!isLoading && !error && vehicles.length === 0 ? (
              <Card className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                <p className="font-display text-4xl text-ink">
                  No vehicles found
                </p>
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
                  Try adjusting or clearing the filters to see more inventory.
                </p>
              </Card>
            ) : null}

            {!isLoading && !error && vehicles.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    token={token}
                    onPurchased={handlePurchased}
                    isAdmin={user?.role === 'admin'}
                    onEdit={setFormVehicle}
                    onDeleted={handleDeleted}
                    onRestocked={handlePurchased}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
      {user?.role === 'admin' && formVehicle ? (
        <VehicleFormModal
          token={token}
          {...(formVehicle === 'new' ? {} : { vehicle: formVehicle })}
          onSaved={handleSaved}
          onClose={() => setFormVehicle(undefined)}
        />
      ) : null}
    </main>
  );
}
