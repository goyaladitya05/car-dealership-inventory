import type { HTMLAttributes } from 'react';

export function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[1.75rem] border border-white/80 bg-white/72 shadow-soft backdrop-blur-xl ${className}`}
      {...props}
    />
  );
}
