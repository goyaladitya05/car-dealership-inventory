import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Brand } from './Brand';

interface AuthLayoutProps {
  children: ReactNode;
  alternateHref: '/login' | '/register';
  alternateLabel: string;
}

export function AuthLayout({
  children,
  alternateHref,
  alternateLabel,
}: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas px-5 pb-12">
      <div className="auth-glow" aria-hidden="true" />
      <nav className="relative z-10 mx-auto flex h-20 max-w-6xl items-center justify-between">
        <Brand />
        <Link
          to={alternateHref}
          className="rounded-full border border-line/80 bg-white/70 px-5 py-2.5 text-sm font-medium text-ink backdrop-blur transition hover:bg-white"
        >
          {alternateLabel}
        </Link>
      </nav>
      <div className="relative z-10 mx-auto flex max-w-6xl justify-center pt-10 sm:pt-16">
        {children}
      </div>
      <p className="relative z-10 mx-auto mt-10 text-center text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted">
        Every vehicle. One clear view.
      </p>
    </main>
  );
}
