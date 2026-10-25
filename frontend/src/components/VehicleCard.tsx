import { useEffect, useRef, useState } from 'react';

import {
  purchaseVehicle,
  removeVehicle,
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
}: VehicleCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const soldOut = vehicle.quantity === 0;
  const lowStock = vehicle.quantity > 0 && vehicle.quantity <= 3;

  return (
    <Card className="group flex min-h-72 flex-col overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-periwinkle hover:shadow-[0_28px_80px_rgb(30_37_74/14%)]">
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full bg-periwinkle/45 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-indigo-900">
          {vehicle.category}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            soldOut
              ? 'bg-red-50 text-red-700'
              : lowStock
                ? 'bg-orange-50 text-orange-700'
                : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {soldOut
            ? 'Out of stock'
            : `${vehicle.quantity} ${vehicle.quantity === 1 ? 'unit' : 'units'} available`}
        </span>
      </div>

      <div className="mt-8 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {vehicle.make}
        </p>
        <h2 className="mt-2 font-display text-4xl leading-none tracking-[-0.025em] text-ink">
          {vehicle.make} {vehicle.model}
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
        ) : (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-line/70 pt-5">
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 px-4 text-xs"
              aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
              onClick={() => onEdit?.(vehicle)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 px-4 text-xs"
              aria-label={`Restock ${vehicle.make} ${vehicle.model}`}
            >
              Restock
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 px-4 text-xs text-red-700"
              aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
              onClick={() => setIsConfirmingDelete(true)}
            >
              Delete
            </Button>
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
    </Card>
  );
}
