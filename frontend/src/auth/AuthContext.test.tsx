import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '../lib/api-client';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../lib/api-client', () => ({
  apiRequest: vi.fn(),
}));

const authResult = {
  token: 'signed-token',
  user: { id: 'user-1', email: 'driver@example.com', role: 'user' as const },
};

function AuthProbe() {
  const { user, token, login, register, logout } = useAuth();

  return (
    <div>
      <output>{user?.email ?? 'signed out'}</output>
      <span>{token ?? 'no token'}</span>
      <button onClick={() => void login('driver@example.com', 'password123')}>
        Log in
      </button>
      <button
        onClick={() => void register('driver@example.com', 'password123')}
      >
        Register
      </button>
      <button onClick={logout}>Log out</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it('restores a saved session from local storage', () => {
    localStorage.setItem('autovault.auth', JSON.stringify(authResult));

    renderAuth();

    expect(screen.getByText('driver@example.com')).toBeInTheDocument();
    expect(screen.getByText('signed-token')).toBeInTheDocument();
  });

  it('logs in and persists the returned session', async () => {
    vi.mocked(apiRequest).mockResolvedValue(authResult);
    renderAuth();

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(apiRequest).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: { email: 'driver@example.com', password: 'password123' },
    });
    expect(await screen.findByText('driver@example.com')).toBeInTheDocument();
    expect(localStorage.getItem('autovault.auth')).toBe(
      JSON.stringify(authResult),
    );
  });

  it('registers through the API and can log out', async () => {
    vi.mocked(apiRequest).mockResolvedValue(authResult);
    renderAuth();

    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(apiRequest).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      body: { email: 'driver@example.com', password: 'password123' },
    });
    expect(await screen.findByText('driver@example.com')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(localStorage.getItem('autovault.auth')).toBeNull();
  });
});
