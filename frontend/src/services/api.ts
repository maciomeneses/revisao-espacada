import { User, Role } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  role: Role;
}

function getToken(): string | null {
  const session = localStorage.getItem('ebbin_session');
  if (!session) return null;
  try {
    return JSON.parse(session).token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Backend returns RFC 9457 ProblemDetail — field is "detail", not "message"
    throw new Error(body.detail ?? body.message ?? `Erro ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    forgotPassword: (email: string) =>
      request<void>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },

  admin: {
    users: {
      list: () => request<User[]>('/api/admin/users'),
      create: (user: Partial<User>) =>
        request<User>('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(user),
        }),
      update: (id: string, user: Partial<User>) =>
        request<User>(`/api/admin/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(user),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/users/${id}`, { method: 'DELETE' }),
    },
  },

  subjects: {
    list: () => request<unknown[]>('/api/subjects'),

    sync: (subjects: unknown[]) =>
      request<unknown[]>('/api/subjects/sync', {
        method: 'POST',
        body: JSON.stringify(subjects),
      }),

    upsert: (id: string, subject: unknown) =>
      request<unknown>(`/api/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(subject),
      }),

    delete: (id: string) =>
      request<void>(`/api/subjects/${id}`, { method: 'DELETE' }),
  },
};
