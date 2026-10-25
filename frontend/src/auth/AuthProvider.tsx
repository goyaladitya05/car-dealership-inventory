import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { apiRequest } from '../lib/api-client';
import {
  AuthContext,
  type AuthContextValue,
  type AuthSession,
} from './auth-context';

const storageKey = 'autovault.auth';

function readStoredSession(): AuthSession | null {
  const storedSession = localStorage.getItem(storageKey);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as AuthSession;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession);

  const authenticate = useCallback(
    async (endpoint: 'login' | 'register', email: string, password: string) => {
      const nextSession = await apiRequest<AuthSession>(
        `/api/auth/${endpoint}`,
        {
          method: 'POST',
          body: { email, password },
        },
      );

      localStorage.setItem(storageKey, JSON.stringify(nextSession));
      setSession(nextSession);
    },
    [],
  );

  const login = useCallback(
    (email: string, password: string) => authenticate('login', email, password),
    [authenticate],
  );
  const register = useCallback(
    (email: string, password: string) =>
      authenticate('register', email, password),
    [authenticate],
  );
  const logout = useCallback(() => {
    localStorage.removeItem(storageKey);
    setSession(null);
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      token: session?.token ?? null,
      user: session?.user ?? null,
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
