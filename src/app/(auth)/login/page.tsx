'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [documentId, setDocumentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loginSuccess && isAuthenticated && user) {
      setLoginSuccess(false);
      router.replace(user.role === 'SELLER' ? '/sales' : '/dashboard');
    }
  }, [loginSuccess, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ document: documentId, password });
      setLoginSuccess(true);
    } catch (err) {
      const message = (err as Error)?.message || 'Error de credenciales o conexión al servidor.';

      if (message.startsWith('No se pudo conectar con el servidor')) {
        setError('');
        toast.error(message, {
          duration: 7000,
        });
      } else {
        setError(message);
        toast.error(message, {
          duration: 5000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[var(--bg-surface)] p-3 sm:p-4">
      <div className="w-full min-w-0 max-w-md animate-fadeIn">
        <div className="glass flex flex-col gap-5 p-5 sm:gap-6 sm:p-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-h)] flex items-center justify-center font-bold text-white shadow-lg text-xl">
              DB
            </div>
          </div>

          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">los Amigos</h1>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="app-alert-error p-3 text-sm rounded-lg shadow-sm animate-slideIn"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5" htmlFor="document">
                  Documento de Identidad
                </label>
                <Input
                  id="document"
                  type="text"
                  placeholder="ej. 10203040"
                  required
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5" htmlFor="password">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" disabled={isSubmitting || !documentId || !password}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          <div className="text-center text-xs text-[var(--text-muted)] mt-4">
            Sistema administrativo &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
