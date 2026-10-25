import { createContext, useContext } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
