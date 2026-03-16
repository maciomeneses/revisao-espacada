const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  role: string;
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
    throw new Error(body.message ?? `Erro ${res.status}`);
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
