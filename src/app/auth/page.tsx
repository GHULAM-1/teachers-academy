import AuthForm from '@/components/auth/auth-form';
import { Suspense } from 'react';

export default function AuthPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm error={searchParams.error} />
    </Suspense>
  );
} 