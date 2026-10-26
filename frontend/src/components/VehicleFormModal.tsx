import { useEffect, useState, type FormEvent } from 'react';

import {
  createVehicle,
  updateVehicle,
  type Vehicle,
  type VehicleInput,
  type VehicleUpdate,
} from '../lib/vehicles-api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface VehicleFormModalProps {
  token: string;
  vehicle?: Vehicle;
  onClose: () => void;
  onSaved: (vehicle: Vehicle) => void;
}

interface FormValues {
  make: string;
  model: string;
  category: string;
  price: string;
  quantity: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

function initialValues(vehicle?: Vehicle): FormValues {
  return {
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? '',
    price: vehicle ? String(vehicle.price) : '',
    quantity: vehicle ? String(vehicle.quantity) : '',
  };
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  for (const field of ['make', 'model', 'category'] as const) {
    const label = `${field[0]?.toUpperCase()}${field.slice(1)}`;
    const value = values[field].trim();

    if (!value) {
      errors[field] = `${label} is required`;
    } else if (value.length > 100) {
      errors[field] = `${label} must be 100 characters or less`;
    }
  }

  const price = Number(values.price);
  if (!values.price || !Number.isFinite(price) || price <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  const quantity = Number(values.quantity);
  if (!values.quantity || !Number.isInteger(quantity) || quantity < 0) {
    errors.quantity = 'Quantity must be a whole number of 0 or more';
  }

  return errors;
}

function toInput(values: FormValues): VehicleInput {
  return {
    make: values.make.trim(),
    model: values.model.trim(),
    category: values.category.trim(),
    price: Number(values.price),
    quantity: Number(values.quantity),
  };
}

function changedFields(input: VehicleInput, vehicle: Vehicle): VehicleUpdate {
  return {
    ...(input.make === vehicle.make ? {} : { make: input.make }),
    ...(input.model === vehicle.model ? {} : { model: input.model }),
    ...(input.category === vehicle.category
      ? {}
      : { category: input.category }),
    ...(input.price === vehicle.price ? {} : { price: input.price }),
    ...(input.quantity === vehicle.quantity
      ? {}
      : { quantity: input.quantity }),
  };
}

export function VehicleFormModal({
  token,
  vehicle,
  onClose,
  onSaved,
}: VehicleFormModalProps) {
  const [values, setValues] = useState(() => initialValues(vehicle));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(vehicle);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function setField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setServerError(undefined);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const input = toInput(values);
    setIsSaving(true);

    try {
      const savedVehicle = vehicle
        ? await updateVehicle(vehicle.id, changedFields(input, vehicle), token)
        : await createVehicle(input, token);
      onSaved(savedVehicle);
      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Unable to save vehicle',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-night/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-form-title"
        className="max-h-[95vh] w-full overflow-y-auto rounded-t-[2rem] bg-canvas p-5 shadow-2xl sm:max-w-xl sm:rounded-[2rem] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              Admin inventory
            </p>
            <h2
              id="vehicle-form-title"
              className="mt-2 font-display text-4xl text-ink"
            >
              {isEditing ? 'Edit vehicle' : 'Add vehicle'}
            </h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="min-h-10 px-4"
            aria-label="Close vehicle form"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Make"
              error={errors.make}
              value={values.make}
              maxLength={101}
              autoFocus
              onChange={(event) => setField('make', event.target.value)}
            />
            <Input
              label="Model"
              error={errors.model}
              value={values.model}
              maxLength={101}
              onChange={(event) => setField('model', event.target.value)}
            />
          </div>
          <Input
            label="Category"
            error={errors.category}
            value={values.category}
            maxLength={101}
            onChange={(event) => setField('category', event.target.value)}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Price"
              error={errors.price}
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={values.price}
              onChange={(event) => setField('price', event.target.value)}
            />
            <Input
              label="Quantity"
              error={errors.quantity}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={values.quantity}
              onChange={(event) => setField('quantity', event.target.value)}
            />
          </div>

          {serverError ? (
            <p role="alert" className="text-sm text-red-700">
              {serverError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? 'Saving...'
                : isEditing
                  ? 'Save changes'
                  : 'Add vehicle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
