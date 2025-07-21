"use client";

import { useAuth } from '@/components/auth/auth-provider';
import LayoutContent from '@/components/layout-content';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Routes that don't require authentication
  const publicRoutes = ['/auth'];
  const isPublicRoute = publicRoutes.includes(pathname);

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
  }, [user, loading, pathname, isPublicRoute, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4EDFF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02133B] mx-auto mb-4"></div>
          <p className="text-[#02133B] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page without layout for unauthenticated users
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