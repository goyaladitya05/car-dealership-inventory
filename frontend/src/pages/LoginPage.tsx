import { AuthForm } from '../components/AuthForm';
import { AuthLayout } from '../components/AuthLayout';

export function LoginPage() {
  return (
    <AuthLayout alternateHref="/register" alternateLabel="Create account">
      <AuthForm mode="login" />
    </AuthLayout>
  );
}
