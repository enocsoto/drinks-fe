'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { Button } from '@/components/ui/button';
import { NAV_ITEMS, isNavItemActive } from './dashboard-nav';
import { cn } from '@/lib/utils';
import { getPendingCorrectionCount } from '@/lib/api/sale-correction-requests.api';
import { subscribeSaleCorrectionsRealtime } from '@/lib/realtime/sale-corrections-socket';

const PENDING_CORRECTIONS_POLL_MS = 120_000;

export function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCorrections, setPendingCorrections] = useState<number | null>(null);
  const isAdmin = user?.role === 'ADMIN';

  const allowedItems = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  const refreshPendingCorrections = useCallback(() => {
    if (!isAdmin) return;
    getPendingCorrectionCount()
      .then((r) => setPendingCorrections(r.count))
      .catch(() => setPendingCorrections(null));
  }, [isAdmin]);

  useEffect(() => {
    const close = () => setMobileMenuOpen(false);
    queueMicrotask(close);
  }, [pathname]);

  useEffect(() => {
    if (!isAdmin) return;
    void refreshPendingCorrections();
    const pollId = setInterval(refreshPendingCorrections, PENDING_CORRECTIONS_POLL_MS);
    const socket = subscribeSaleCorrectionsRealtime(() => {
      void refreshPendingCorrections();
    });
    return () => {
      clearInterval(pollId);
      socket?.disconnect();
    };
  }, [isAdmin, refreshPendingCorrections]);

  return (
    <header className="relative z-10 flex h-16 min-w-0 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-base)] px-3 transition-colors sm:px-4 md:px-6">
      {mobileMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default border-0 bg-[var(--bg-overlay)] md:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        {/* Hamburger solo en móvil: despliega menú hacia abajo */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-secondary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileMenuOpen}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Menú desplegable móvil: hacia abajo */}
        {mobileMenuOpen && (
          <div
            className="absolute left-0 right-0 top-16 z-50 max-h-[min(100dvh-4rem,24rem)] overflow-y-auto border-b border-[var(--border)] bg-[var(--bg-base)] py-2 shadow-lg animate-fadeIn"
            role="menu"
          >
            <nav className="flex flex-col px-2">
              {allowedItems.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--sidebar-active)] text-white'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)]',
                    )}
                    role="menuitem"
                  >
                    <div className="shrink-0">{item.icon}</div>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
        {isAdmin && (
          <Link
            href="/sale-corrections"
            className="relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span className="hidden sm:inline">Correcciones</span>
            <span className="sm:hidden" aria-hidden>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </span>
            {typeof pendingCorrections === 'number' && pendingCorrections > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white leading-none">
                {pendingCorrections > 99 ? '99+' : pendingCorrections}
              </span>
            )}
          </Link>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-secondary)]"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-sm font-medium text-[var(--text-primary)]">{user?.name}</span>
          <span className="text-xs text-[var(--text-muted)]">{user?.role}</span>
        </div>

        <Button variant="outline" size="sm" onClick={logout}>
          Salir
        </Button>
      </div>
    </header>
  );
}
