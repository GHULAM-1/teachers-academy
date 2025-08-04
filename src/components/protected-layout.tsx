"use client";

import { useAuth } from '@/components/auth/auth-provider';
import LayoutContent from '@/components/layout-content';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/components/ui/loading';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Routes that don't require authentication
  const publicRoutes = ['/auth', '/'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Routes that should show without layout (landing page)
  const noLayoutRoutes = ['/'];
  const shouldShowLayout = !noLayoutRoutes.includes(pathname);

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    // If user is not authenticated and not on a public route
    if (!user && !isPublicRoute) {
      router.push('/auth');
      return;
    }
    
    // If user is authenticated and on auth page, redirect to mentor
    if (user && pathname === '/auth') {
      router.push('/mentor');
      return;
    }
    
    // If user is authenticated and on landing page, redirect to home
    if (user) {
      router.push('/home');
      return;
    }
  }, [user, loading, pathname, isPublicRoute, router]);

  // Show loading state only in content area, not full screen
  if (loading) {
    return <LayoutContent isLoading={true}><div></div></LayoutContent>;
  }

  // Show landing page without layout for unauthenticated users
  if (!user && isPublicRoute) {
    return <>{children}</>;
  }

  // Show nothing while redirecting unauthenticated users
  if (!user && !isPublicRoute) {
    return null;
  }

  // Show full layout for authenticated users
  return (
    <LayoutContent>
      {children}
    </LayoutContent>
  );
} 