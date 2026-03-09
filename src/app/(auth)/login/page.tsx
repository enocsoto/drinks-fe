'use client';

import { useState, useEffect } from 'react';
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

  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirigir al dashboard solo cuando el contexto ya tiene usuario (evita condición de carrera)
  useEffect(() => {
    if (loginSuccess && isAuthenticated) {
      setLoginSuccess(false);
      router.replace('/dashboard');
    }
  }, [loginSuccess, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ document: documentId, password });
      setLoginSuccess(true);
    } catch (err) {
      setError((err as Error)?.message || 'Error de credenciales o conexión al servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-surface)] p-4">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="glass p-8 flex flex-col gap-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-h)] flex items-center justify-center font-bold text-white shadow-lg text-xl">
              DB
            </div>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">los Amigos</h1>
            <p className="text-sm text-[var(--text-muted)]">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded bg-red-50 text-red-600 border border-red-200 shadow-sm animate-slideIn">
                {error}
              </div>
            )}

            <div className="space-y-4">
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
