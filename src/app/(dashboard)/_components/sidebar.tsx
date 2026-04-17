'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, isNavItemActive } from './dashboard-nav';

const ChevronLeftIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const allowedItems = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 h-screen z-20 border-r border-[#334155] shadow-xl bg-[var(--sidebar-bg)] text-[var(--sidebar-text)]',
        'transition-[width] duration-300 ease-in-out overflow-hidden',
        isCollapsed ? 'w-20' : 'w-64',
      )}
    >
      <div
        className={cn(
          'h-16 shrink-0 border-b border-[#334155] bg-black/10 min-w-0 flex items-center gap-2',
          isCollapsed ? 'px-2 justify-center' : 'justify-between px-3 lg:px-4',
        )}
      >
        {isCollapsed ? (
          <>
            <div className="w-8 h-8 rounded bg-[var(--brand-primary)] flex items-center justify-center font-bold text-white shadow-sm shrink-0">
              DB
            </div>
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              title="Expandir menú"
              className="shrink-0 p-1.5 rounded-md text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--sidebar-bg)]"
              aria-label="Expandir menú"
            >
              <ChevronRightIcon />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <div className="w-8 h-8 rounded bg-[var(--brand-primary)] flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                DB
              </div>
              <span className="font-bold text-lg tracking-tight whitespace-nowrap">los Amigos</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              title="Recoger menú"
              className="shrink-0 p-1.5 rounded-md text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--sidebar-bg)]"
              aria-label="Recoger menú"
            >
              <ChevronLeftIcon />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        <div
          className={cn(
            'px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap transition-opacity duration-200',
            isCollapsed ? 'opacity-0 h-0 overflow-hidden p-0 m-0' : 'opacity-100',
          )}
        >
          MENÚ PRINCIPAL
        </div>

        {allowedItems.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'flex items-center rounded-md text-sm font-medium transition-all group min-h-[2.75rem]',
                isCollapsed ? 'justify-center gap-0 px-0 py-2.5' : 'gap-3 px-3 py-2.5 lg:justify-start',
                isActive
                  ? 'bg-[var(--sidebar-active)] text-white shadow-sm'
                  : 'text-gray-300 hover:bg-[var(--sidebar-hover)] hover:text-white',
              )}
            >
              <div
                className={cn(
                  'shrink-0 flex items-center justify-center transition-colors',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-[var(--brand-primary-l)]',
                )}
              >
                {item.icon}
              </div>
              <span
                className={cn(
                  'whitespace-nowrap transition-opacity duration-200',
                  isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          'border-t border-[#334155] bg-black/10 flex items-center min-w-0 shrink-0 transition-[padding] duration-300',
          isCollapsed ? 'justify-center gap-0 py-4 px-2' : 'gap-3 p-4 lg:justify-start',
        )}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--brand-primary)] to-[var(--brand-primary-h)] flex items-center justify-center text-white font-bold shadow-md shrink-0">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div
          className={cn(
            'flex flex-col min-w-0 transition-opacity duration-200 overflow-hidden',
            isCollapsed ? 'opacity-0 w-0 h-0 overflow-hidden' : 'opacity-100',
          )}
        >
          <span className="text-sm font-medium truncate">{user?.name}</span>
          <span className="text-xs text-gray-400">{user?.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}</span>
        </div>
      </div>
    </aside>
  );
}
