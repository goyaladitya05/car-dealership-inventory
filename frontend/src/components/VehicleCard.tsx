import { useEffect, useRef, useState, type FormEvent } from 'react';

import {
  purchaseVehicle,
  removeVehicle,
  restockVehicle,
  type Vehicle,
} from '../lib/vehicles-api';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface VehicleCardProps {
  vehicle: Vehicle;
  token: string;
  onPurchased: (vehicle: Vehicle) => void;
  isAdmin?: boolean;
  onEdit?: (vehicle: Vehicle) => void;
  onDeleted?: (id: string) => void;
  onRestocked?: (vehicle: Vehicle) => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function VehicleCard({
  vehicle,
  token,
  onPurchased,
  isAdmin = false,
  onEdit,
  onDeleted,
  onRestocked,
}: VehicleCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState<string>();
  const [showRestock, setShowRestock] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState('1');
  const [restockError, setRestockError] = useState<string>();
  const [message, setMessage] = useState<{
    kind: 'success' | 'error';
    text: string;
  }>();
  const messageTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(messageTimer.current), []);

  async function handlePurchase() {
    setIsPurchasing(true);
    setMessage(undefined);
    clearTimeout(messageTimer.current);

    try {
      const updatedVehicle = await purchaseVehicle(vehicle.id, 1, token);
      onPurchased(updatedVehicle);
      setMessage({ kind: 'success', text: 'Purchase complete' });
      messageTimer.current = setTimeout(() => setMessage(undefined), 2500);
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Purchase failed',
      });
    } finally {
      setIsPurchasing(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setMessage(undefined);

    try {
      await removeVehicle(vehicle.id, token);
      onDeleted?.(vehicle.id);
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Delete failed',
      });
      setIsConfirmingDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleRestock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantity = Number(restockQuantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setRestockError('Quantity must be a whole number of 1 or more');
      return;
    }

    setIsRestocking(true);
    setRestockError(undefined);
    setMessage(undefined);

    try {
      const updatedVehicle = await restockVehicle(vehicle.id, quantity, token);
      onRestocked?.(updatedVehicle);
      setShowRestock(false);
      setRestockQuantity('1');
      setMessage({ kind: 'success', text: 'Stock updated' });
      clearTimeout(messageTimer.current);
      messageTimer.current = setTimeout(() => setMessage(undefined), 2500);
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Restock failed',
      });
    } finally {
      setIsRestocking(false);
    }
  }

  const soldOut = vehicle.quantity === 0;
  const lowStock = vehicle.quantity > 0 && vehicle.quantity <= 3;
  const vehicleName = `${vehicle.make} ${vehicle.model}`;

  return (
    <Card
      className={`group flex h-full min-h-72 flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-periwinkle hover:shadow-[0_28px_80px_rgb(30_37_74/14%)] ${soldOut ? 'saturate-50' : ''}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-indigo-100 via-periwinkle/50 to-orange-100">
        {vehicle.imageUrl && vehicle.imageUrl !== failedImageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={vehicleName}
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-[1.035]"
            onError={() => setFailedImageUrl(vehicle.imageUrl ?? undefined)}
          />
        ) : (
          <div
            aria-label={`No photo available for ${vehicleName}`}
            className="flex size-full items-center justify-center"
          >
            <svg
              viewBox="0 0 240 120"
              aria-hidden="true"
              className="w-3/5 text-indigo-950/30"
              fill="none"
            >
              <path
                d="M43 76 60 47c4-7 10-11 18-12h75c9 0 16 4 21 12l18 29 18 7c7 3 11 9 11 16v3H20v-7c0-8 5-15 13-17l10-2Z"
                fill="currentColor"
              />
              <path
                d="M73 48h38v27H57l16-27Zm51 0h28c6 0 10 3 13 8l12 19h-53V48Z"
                fill="white"
                fillOpacity=".62"
              />
              <circle cx="63" cy="99" r="15" fill="white" />
              <circle cx="63" cy="99" r="8" fill="currentColor" />
              <circle cx="180" cy="99" r="15" fill="white" />
              <circle cx="180" cy="99" r="8" fill="currentColor" />
            </svg>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className="rounded-full bg-white/88 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-indigo-900 shadow-sm backdrop-blur">
            {vehicle.category}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur ${
              soldOut
                ? 'bg-red-50/92 text-red-700'
                : lowStock
                  ? 'bg-orange-50/92 text-orange-700'
                  : 'bg-emerald-50/92 text-emerald-700'
            }`}
          >
            {soldOut
              ? 'Out of stock'
              : `${vehicle.quantity} ${vehicle.quantity === 1 ? 'unit' : 'units'} available`}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {vehicle.make}
          </p>
          <h2 className="mt-2 font-display text-4xl leading-none tracking-[-0.025em] text-ink">
            {vehicleName}
          </h2>
          <p className="mt-5 text-xl font-medium tracking-[-0.02em] text-ink">
            {currencyFormatter.format(vehicle.price)}
          </p>
        </div>

        {isAdmin ? (
          isConfirmingDelete ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/80 p-4">
              <p className="text-sm font-medium text-red-900">
                Delete {vehicle.make} {vehicle.model}?
              </p>
              <p className="mt-1 text-xs leading-5 text-red-700">
                This permanently removes the vehicle from inventory.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-9 px-4 text-xs"
                  disabled={isDeleting}
                  onClick={() => setIsConfirmingDelete(false)}
                >
                  Cancel delete
                </Button>
                <Button
                  type="button"
                  className="min-h-9 border-red-700 bg-red-700 px-4 text-xs hover:bg-red-800"
                  disabled={isDeleting}
                  onClick={() => void handleDelete()}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm delete'}
                </Button>
              </div>
            </div>
          ) : showRestock ? (
            <form
              className="mt-6 rounded-2xl border border-periwinkle bg-periwinkle/20 p-4"
              onSubmit={handleRestock}
              noValidate
            >
              <label className="block text-sm font-medium text-ink">
                Restock quantity for {vehicle.make} {vehicle.model}
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  autoFocus
                  value={restockQuantity}
                  aria-invalid={Boolean(restockError)}
                  onChange={(event) => {
                    setRestockQuantity(event.target.value);
                    setRestockError(undefined);
                  }}
                  className="mt-2 min-h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-night focus:ring-3 focus:ring-periwinkle/45"
                />
              </label>
              {restockError ? (
                <p className="mt-2 text-xs text-red-700">{restockError}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-9 px-4 text-xs"
                  disabled={isRestocking}
                  onClick={() => {
                    setShowRestock(false);
                    setRestockError(undefined);
                  }}
                >
                  Cancel restock
                </Button>
                <Button
                  type="submit"
                  className="min-h-9 px-4 text-xs"
                  disabled={isRestocking}
                >
                  {isRestocking ? 'Adding...' : 'Add stock'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-5 flex items-center gap-1 border-t border-line/70 pt-3">
              <button
                type="button"
                className="min-h-9 rounded-lg px-3 text-xs font-medium text-muted transition hover:bg-periwinkle/30 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                onClick={() => onEdit?.(vehicle)}
              >
                Edit
              </button>
              <button
                type="button"
                className="min-h-9 rounded-lg px-3 text-xs font-medium text-muted transition hover:bg-periwinkle/30 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                aria-label={`Restock ${vehicle.make} ${vehicle.model}`}
                onClick={() => setShowRestock(true)}
              >
                Restock
              </button>
              <button
                type="button"
                className="min-h-9 rounded-lg px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
                onClick={() => setIsConfirmingDelete(true)}
              >
                Delete
              </button>
            </div>
          )
        ) : null}

        <div className="mt-7 flex min-h-12 items-center justify-between gap-3 border-t border-line/70 pt-5">
          <div className="min-w-0 text-xs">
            {message ? (
              <p
                role={message.kind === 'error' ? 'alert' : 'status'}
                className={
                  message.kind === 'error' ? 'text-red-700' : 'text-emerald-700'
                }
              >
                {message.text}
              </p>
            ) : soldOut ? (
              <p className="text-red-700">Unavailable</p>
            ) : lowStock ? (
              <p className="text-orange-700">Low stock</p>
            ) : (
              <p className="text-muted">Ready to purchase</p>
            )}
          </div>
          <Button
            type="button"
            className="min-h-10 shrink-0 px-5"
            disabled={soldOut || isPurchasing}
            onClick={() => void handlePurchase()}
          >
            {soldOut ? 'Sold out' : isPurchasing ? 'Purchasing...' : 'Purchase'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
