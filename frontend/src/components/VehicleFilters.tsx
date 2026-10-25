import { useEffect, useRef, useState } from 'react';

import type { VehicleFilters as Filters } from '../lib/vehicles-api';
import { Button } from './ui/Button';

interface VehicleFiltersProps {
  categories: string[];
  onChange: (filters: Filters) => void;
}

interface FilterValues {
  make: string;
  model: string;
  category: string;
  minPrice: string;
  maxPrice: string;
}

const emptyFilters: FilterValues = {
  make: '',
  model: '',
  category: '',
  minPrice: '',
  maxPrice: '',
};

function toFilters(values: FilterValues): Filters {
  return {
    ...(values.make.trim() ? { make: values.make.trim() } : {}),
    ...(values.model.trim() ? { model: values.model.trim() } : {}),
    ...(values.category ? { category: values.category } : {}),
    ...(values.minPrice ? { minPrice: Number(values.minPrice) } : {}),
    ...(values.maxPrice ? { maxPrice: Number(values.maxPrice) } : {}),
  };
}

const inputClasses =
  'min-h-11 w-full rounded-2xl border border-line bg-white/80 px-4 text-sm text-ink outline-none transition placeholder:text-muted/55 focus:border-night focus:ring-3 focus:ring-periwinkle/45';

export function VehicleFilters({ categories, onChange }: VehicleFiltersProps) {
  const [values, setValues] = useState(emptyFilters);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function updateText(field: 'make' | 'model', value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(toFilters(next)), 300);
  }

  function updateImmediate(
    field: 'category' | 'minPrice' | 'maxPrice',
    value: string,
  ) {
    const next = { ...values, [field]: value };
    setValues(next);
    clearTimeout(timer.current);
    onChange(toFilters(next));
  }

  function clearFilters() {
    clearTimeout(timer.current);
    setValues(emptyFilters);
    onChange({});
  }

  const hasFilters = Object.values(values).some(Boolean);

  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white/72 p-4 shadow-soft backdrop-blur-xl sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.9fr_0.8fr_0.8fr_auto] lg:items-end">
        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="block">Make</span>
          <input
            className={inputClasses}
            value={values.make}
            onChange={(event) => updateText('make', event.target.value)}
            placeholder="Search make"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="block">Model</span>
          <input
            className={inputClasses}
            value={values.model}
            onChange={(event) => updateText('model', event.target.value)}
            placeholder="Search model"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="block">Category</span>
          <select
            className={inputClasses}
            value={values.category}
            onChange={(event) =>
              updateImmediate('category', event.target.value)
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="block">Minimum price</span>
          <input
            className={inputClasses}
            type="number"
            min="0"
            value={values.minPrice}
            onChange={(event) =>
              updateImmediate('minPrice', event.target.value)
            }
            placeholder="Min"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-ink">
          <span className="block">Maximum price</span>
          <input
            className={inputClasses}
            type="number"
            min="0"
            value={values.maxPrice}
            onChange={(event) =>
              updateImmediate('maxPrice', event.target.value)
            }
            placeholder="Max"
          />
        </label>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 whitespace-nowrap px-4"
          disabled={!hasFilters}
          onClick={clearFilters}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
