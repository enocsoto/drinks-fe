'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/context/theme-context';

export function AppToaster() {
  const { theme } = useTheme();
  return <Toaster richColors position="top-center" theme={theme} closeButton />;
}
