'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const SELLER_ALLOWED_PATHS = new Set(['/sales', '/sales/corrections']);

function isSellerPathAllowed(pathname: string): boolean {
  return SELLER_ALLOWED_PATHS.has(pathname);
}

/**
 * Mesero (SELLER): solo `/sales` y solicitud de corrección del día (`/sales/corrections`).
 */
export function SellerRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role === 'SELLER' && !isSellerPathAllowed(pathname)) {
      router.replace('/sales');
    }
  }, [user, isLoading, pathname, router]);

  if (!isLoading && user?.role === 'SELLER' && !isSellerPathAllowed(pathname)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[var(--brand-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
