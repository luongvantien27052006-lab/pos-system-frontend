import { Suspense } from 'react';
import { StaffLoginForm } from './login-form';

export default function StaffLoginPage() {
  return (
    <Suspense>
      <StaffLoginForm />
    </Suspense>
  );
}