import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api-client';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';

interface FormErrors {
  email?: string;
  password?: string;
}

interface AuthFormProps {
  mode: 'login' | 'register';
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
}

export function AuthForm({ mode }: AuthFormProps) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLogin = mode === 'login';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(email, password);
    setErrors(nextErrors);
    setServerError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await (isLogin ? login(email, password) : register(email, password));
      navigate('/', { replace: true });
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Unable to continue',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-[29rem] text-center">
      <p className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-indigo-700">
        Dealership intelligence
      </p>
      <h1 className="font-display text-5xl leading-[0.96] tracking-[-0.035em] text-ink sm:text-6xl">
        {isLogin ? 'Welcome back.' : 'Start your journey.'}
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted">
        {isLogin
          ? 'Sign in to see your inventory and keep every vehicle moving.'
          : 'Create an account to bring your dealership inventory into focus.'}
      </p>

      <Card className="mt-8 p-6 text-left sm:p-8">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {serverError ? (
            <div
              role="alert"
              aria-label="Authentication error"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {serverError}
            </div>
          ) : null}
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@dealership.com"
            value={email}
            error={errors.email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            placeholder="At least 8 characters"
            value={password}
            error={errors.password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button className="mt-1 w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isLogin
                ? 'Logging in...'
                : 'Creating account...'
              : isLogin
                ? 'Log in'
                : 'Create account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {isLogin ? 'New to AutoVault?' : 'Already have an account?'}{' '}
          <Link
            className="font-medium text-ink underline decoration-line underline-offset-4"
            to={isLogin ? '/register' : '/login'}
          >
            {isLogin ? 'Create an account' : 'Log in'}
          </Link>
        </p>
      </Card>
    </section>
  );
}
