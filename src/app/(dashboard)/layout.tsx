'use client';

import { Sidebar } from './_components/sidebar';
import { TopBar } from './_components/topbar';
import { AuthGuard } from './_components/auth-guard';
import { SellerRouteGuard } from './_components/seller-route-guard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SellerRouteGuard>
        <div className="flex h-[100dvh] min-h-0 bg-[var(--bg-surface)] overflow-hidden">
          <Sidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 animate-fadeIn">
              {children}
            </main>
          </div>
        </div>
      </SellerRouteGuard>
    </AuthGuard>
  );
}
