'use client';

import { io, type Socket } from 'socket.io-client';
import { getStoredToken } from '@/lib/auth-token-storage';

/** Origen del backend para WebSocket (no pasa por el rewrite HTTP de Next). */
function getBackendOriginForWs(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  const explicit = process.env.NEXT_PUBLIC_BACKEND_WS_ORIGIN ?? process.env.NEXT_PUBLIC_WS_ORIGIN;
  if (explicit) return explicit.replace(/\/$/, '');
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (api?.startsWith('http')) {
    try {
      return new URL(api).origin;
    } catch {
      /* vacío */
    }
  }
  return 'http://localhost:3001';
}

/**
 * Suscripción en tiempo real (solo admin autenticado). Recibe `corrections:refresh`
 * cuando el mesero crea una solicitud o el admin cambia el estado.
 */
export function subscribeSaleCorrectionsRealtime(onRefresh: () => void): Socket | null {
  const token = getStoredToken();
  if (!token) return null;

  const socket = io(`${getBackendOriginForWs()}/sale-corrections`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
  });

  socket.on('corrections:refresh', () => {
    onRefresh();
  });

  return socket;
}
