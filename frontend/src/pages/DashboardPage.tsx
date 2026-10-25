import { useAuth } from '../auth/AuthContext';
import { Brand } from '../components/Brand';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas px-5 pb-16">
      <div className="dashboard-glow" aria-hidden="true" />
      <nav className="relative z-10 mx-auto flex min-h-20 max-w-6xl flex-wrap items-center justify-between gap-3 py-4">
        <Brand />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">{user?.email}</p>
            <p className="text-xs capitalize text-muted">Dealership account</p>
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

      <section className="relative z-10 mx-auto max-w-6xl pt-16 sm:pt-24">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-indigo-700">
          Inventory workspace
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-6xl leading-[0.94] tracking-[-0.04em] text-ink sm:text-7xl">
          Inventory overview
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted">
          Your vehicle dashboard is arriving next. The secure workspace is ready
          for your dealership data.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {['Vehicles in stock', 'Units sold', 'Inventory value'].map(
            (label) => (
              <Card key={label} className="min-h-40 p-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                  {label}
                </p>
                <p className="mt-8 font-display text-4xl text-ink">
                  Coming soon
                </p>
              </Card>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
