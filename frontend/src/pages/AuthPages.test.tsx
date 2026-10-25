import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api-client';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const login = vi.fn();
const register = vi.fn();

function renderAuthPage(page: 'login' | 'register') {
  return render(
    <MemoryRouter initialEntries={[`/${page}`]}>
      <Routes>
        <Route
          path={`/${page}`}
          element={page === 'login' ? <LoginPage /> : <RegisterPage />}
        />
        <Route path="/" element={<h1>Inventory overview</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('login form', () => {
  beforeEach(() => {
    login.mockReset();
    register.mockReset();
    vi.mocked(useAuth).mockReturnValue({
      token: null,
      user: null,
      login,
      register,
      logout: vi.fn(),
    });
  });

  it('shows field validation without sending invalid credentials', async () => {
    renderAuthPage('login');

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(
      screen.getByText('Password must be at least 8 characters'),
    ).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows the server error when login fails', async () => {
    login.mockRejectedValue(new ApiError('Invalid email or password', 401));
    renderAuthPage('login');

    await userEvent.type(
      screen.getByLabelText('Email address'),
      'driver@example.com',
    );
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      await screen.findByRole('alert', { name: 'Authentication error' }),
    ).toHaveTextContent('Invalid email or password');
  });

  it('redirects to the dashboard after login', async () => {
    login.mockResolvedValue(undefined);
    renderAuthPage('login');

    await userEvent.type(
      screen.getByLabelText('Email address'),
      'driver@example.com',
    );
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Inventory overview')).toBeInTheDocument();
  });
});

describe('registration form', () => {
  beforeEach(() => {
    login.mockReset();
    register.mockReset();
    vi.mocked(useAuth).mockReturnValue({
      token: null,
      user: null,
      login,
      register,
      logout: vi.fn(),
    });
  });

  it('shows validation and a duplicate-email response', async () => {
    renderAuthPage('register');

    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(
      screen.getByText('Password must be at least 8 characters'),
    ).toBeInTheDocument();

    register.mockRejectedValue(new ApiError('Email already registered', 409));
    await userEvent.type(
      screen.getByLabelText('Email address'),
      'driver@example.com',
    );
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    expect(
      await screen.findByRole('alert', { name: 'Authentication error' }),
    ).toHaveTextContent('Email already registered');
  });

  it('redirects to the dashboard after registration', async () => {
    register.mockResolvedValue(undefined);
    renderAuthPage('register');

    await userEvent.type(
      screen.getByLabelText('Email address'),
      'driver@example.com',
    );
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    expect(await screen.findByText('Inventory overview')).toBeInTheDocument();
  });
});
