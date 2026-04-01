export type UserRole = 'ADMIN' | 'SELLER';

export interface UserDto {
  id: string;
  name: string;
  document: number | string;
  /** En la API viene como array; para mostrar usar el primero */
  role: UserRole | UserRole[];
  isActive: boolean;
}

export interface CreateUserDto {
  name: string;
  document: number;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  document?: number;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  document: string;
  role: UserRole;
}

export interface LoginDto {
  document: string;
  password: string;
}

/** Respuesta de POST /auth/login: incluye token y datos del usuario (sin password). */
export interface LoginResponse {
  access_token: string;
  name?: string;
  document?: number;
}
