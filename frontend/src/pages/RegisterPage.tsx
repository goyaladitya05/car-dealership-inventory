import { AuthForm } from '../components/AuthForm';
import { AuthLayout } from '../components/AuthLayout';

export function RegisterPage() {
  return (
    <AuthLayout alternateHref="/login" alternateLabel="Log in">
      <AuthForm mode="register" />
    </AuthLayout>
  );
}
