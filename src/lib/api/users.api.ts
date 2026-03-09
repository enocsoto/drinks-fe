import { apiFetch } from './api-client';
import type { UserDto, CreateUserDto, UpdateUserDto } from '@/types/user.types';

export interface GetUsersParams {
  includeInactive?: boolean;
}

export async function getUsers(params?: GetUsersParams): Promise<UserDto[]> {
  const searchParams = new URLSearchParams();
  if (params?.includeInactive) searchParams.set('includeInactive', 'true');
  const query = searchParams.toString();
  const url = query ? `/user?${query}` : '/user';
  return apiFetch<UserDto[]>(url);
}

export async function getUser(id: string): Promise<UserDto> {
  return apiFetch<UserDto>(`/user/${encodeURIComponent(id)}`);
}

export async function createUser(dto: CreateUserDto): Promise<UserDto> {
  return apiFetch<UserDto>('/user', {
    method: 'POST',
    body: JSON.stringify({
      name: dto.name,
      document: Number(dto.document),
      password: dto.password,
      ...(dto.role != null && { role: dto.role }),
    }),
  });
}

export async function updateUser(id: string, dto: UpdateUserDto): Promise<UserDto> {
  const body: Record<string, unknown> = { ...dto };
  if (dto.document != null) body.document = Number(dto.document);
  if (dto.password === '') delete body.password;
  return apiFetch<UserDto>(`/user/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
