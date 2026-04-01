'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { login as apiLogin, logout as apiLogout, getToken } from '@/lib/api/auth.api';
import type { AuthUser, LoginDto } from '@/types/user.types';
import { jwtDecode } from '@/lib/utils/jwt';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setTimeout(() => setUser(decoded), 0);
      } catch {
        apiLogout();
      }
    }
    setTimeout(() => setIsLoading(false), 0);
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    const response = await apiLogin(dto);
    const decoded = jwtDecode(response.access_token);
    const nameFromApi = typeof response.name === 'string' && response.name.trim() ? response.name : '';
    setUser({ ...decoded, name: nameFromApi || decoded.name });
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
