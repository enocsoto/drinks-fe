'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const ADMIN_ROLE = 'ADMIN';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== ADMIN_ROLE) {
      router.replace(user?.role === 'SELLER' ? '/sales' : '/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[var(--brand-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== ADMIN_ROLE) {
    return null;
  }

  return <>{children}</>;
}
