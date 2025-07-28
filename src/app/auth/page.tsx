import AuthForm from '@/components/auth/auth-form';
import { Suspense } from 'react';

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm error={params.error} />
    </Suspense>
  );
} 