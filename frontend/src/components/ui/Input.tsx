import { useId, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error: string | undefined;
}

export function Input({
  label,
  error,
  id,
  className = '',
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-ink" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className={`min-h-12 w-full rounded-2xl border bg-white/70 px-4 text-[15px] text-ink outline-none transition placeholder:text-muted/55 focus:border-night focus:ring-3 focus:ring-periwinkle/45 ${error ? 'border-red-400' : 'border-line'} ${className}`}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
