'use client';

import { Sidebar } from './_components/sidebar';
import { TopBar } from './_components/topbar';
import { AuthGuard } from './_components/auth-guard';
import { SellerRouteGuard } from './_components/seller-route-guard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SellerRouteGuard>
        <div className="flex h-screen bg-[var(--bg-surface)] overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 w-full min-w-0">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fadeIn">{children}</main>
          </div>
        </div>
      </SellerRouteGuard>
    </AuthGuard>
  );
}
