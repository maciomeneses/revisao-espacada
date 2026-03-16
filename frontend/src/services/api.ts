const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

console.log('[api] BASE_URL =', BASE_URL);

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

  const url = `${BASE_URL}${path}`;
  console.log(`[api] ${options.method ?? 'GET'} ${url}`);

  try {
    const res = await fetch(url, { ...options, headers });

    console.log(`[api] response status: ${res.status}`);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[api] error body:', body);
      throw new Error(body.message ?? `Erro ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (err) {
    console.error('[api] fetch failed:', err);
    throw err;
  }
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
