import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { VehicleFilters as Filters } from '../lib/vehicles-api';
import { VehicleFilters } from './VehicleFilters';

describe('VehicleFilters', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces make and model changes', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();

    render(
      <VehicleFilters categories={['SUV', 'Sedan']} onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText('Make'), {
      target: { value: 'Tata' },
    });
    fireEvent.change(screen.getByLabelText('Model'), {
      target: { value: 'Nexon' },
    });

    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(299);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenLastCalledWith({
      make: 'Tata',
      model: 'Nexon',
    });
  });

  it('applies select and price filters immediately', async () => {
    const onChange = vi.fn();
    render(
      <VehicleFilters categories={['SUV', 'Sedan']} onChange={onChange} />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Category'), 'SUV');
    expect(onChange).toHaveBeenLastCalledWith({ category: 'SUV' });

    await userEvent.type(screen.getByLabelText('Minimum price'), '12000');
    expect(onChange).toHaveBeenLastCalledWith({
      category: 'SUV',
      minPrice: 12000,
    });
  });

  it('clears every filter and reports an empty filter set', async () => {
    const onChange = vi.fn<(filters: Filters) => void>();
    render(
      <VehicleFilters categories={['SUV', 'Sedan']} onChange={onChange} />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Sedan');
    await userEvent.type(screen.getByLabelText('Maximum price'), '50000');
    await userEvent.click(
      screen.getByRole('button', { name: 'Clear filters' }),
    );

    expect(screen.getByLabelText('Category')).toHaveValue('');
    expect(screen.getByLabelText('Maximum price')).toHaveValue(null);
    expect(onChange).toHaveBeenLastCalledWith({});
  });
});
