import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from '../../src/services/api';
import * as storage from '../../src/services/storage';

const BASE_URL = 'http://localhost:8080';

type FetchCall = { url: string; init: RequestInit };
let calls: FetchCall[] = [];
let fetchMock: ReturnType<typeof vi.fn>;

function mockFetchOnce(response: { ok?: boolean; status?: number; json?: () => Promise<unknown> }) {
  const res = {
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: response.json ?? (async () => ({})),
  };
  fetchMock.mockImplementationOnce(async (url: string, init: RequestInit) => {
    calls.push({ url, init: init ?? {} });
    return res as unknown as Response;
  });
}

function mockFetchDefault(response: {
  ok?: boolean;
  status?: number;
  json?: () => Promise<unknown>;
}) {
  const res = {
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: response.json ?? (async () => ({})),
  };
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    calls.push({ url, init: init ?? {} });
    return res as unknown as Response;
  });
}

beforeEach(() => {
  calls = [];
  localStorage.clear();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('request<T> helper', () => {
  it('retorna body JSON em respostas 200', async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ ok: 1 }) });
    const result = await api.subjects.list();
    expect(result).toEqual({ ok: 1 });
    expect(calls[0].url).toBe(`${BASE_URL}/api/subjects`);
  });

  it('retorna undefined em respostas 204', async () => {
    mockFetchOnce({ ok: true, status: 204 });
    const result = await api.subjects.delete('abc');
    expect(result).toBeUndefined();
  });

  it('lança Error com detail (RFC 9457) em respostas de erro', async () => {
    mockFetchOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'campo inválido' }),
    });
    await expect(api.subjects.list()).rejects.toThrow('campo inválido');
  });

  it('lança Error com message quando detail ausente', async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'falha interna' }),
    });
    await expect(api.subjects.list()).rejects.toThrow('falha interna');
  });

  it('lança Error com "Erro <status>" quando body inválido', async () => {
    mockFetchOnce({
      ok: false,
      status: 503,
      json: async () => {
        throw new Error('not json');
      },
    });
    await expect(api.subjects.list()).rejects.toThrow('Erro 503');
  });

  it('seta header Authorization quando token existe', async () => {
    localStorage.setItem(
      'ebbing_session',
      JSON.stringify({ email: 'a@b.com', token: 'tok-123', role: 'USER', timestamp: Date.now() }),
    );
    mockFetchOnce({ ok: true, status: 200, json: async () => [] });
    await api.subjects.list();
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer tok-123');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('não seta Authorization quando não há sessão', async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => [] });
    await api.subjects.list();
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('não seta Authorization quando session é JSON inválido', async () => {
    localStorage.setItem('ebbing_session', '{not-json');
    mockFetchOnce({ ok: true, status: 200, json: async () => [] });
    await api.subjects.list();
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('não seta Authorization quando session não contém token', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ email: 'a@b.com' }));
    mockFetchOnce({ ok: true, status: 200, json: async () => [] });
    await api.subjects.list();
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('401 com sessão ativa em path protegido: limpa session, clearSubjects e reload', async () => {
    localStorage.setItem(
      'ebbing_session',
      JSON.stringify({ email: 'a@b.com', token: 't', role: 'USER', timestamp: Date.now() }),
    );
    const clearSpy = vi.spyOn(storage, 'clearSubjects').mockImplementation(() => {});
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    });

    mockFetchOnce({ ok: false, status: 401, json: async () => ({}) });
    const result = await api.subjects.list();

    expect(result).toBeUndefined();
    expect(localStorage.getItem('ebbing_session')).toBeNull();
    expect(clearSpy).toHaveBeenCalledWith('a@b.com');
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('401 com sessão corrompida: limpa session e recarrega sem lançar', async () => {
    localStorage.setItem('ebbing_session', '{sessao-corrompida');
    const clearSpy = vi.spyOn(storage, 'clearSubjects').mockImplementation(() => {});
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    });

    mockFetchOnce({ ok: false, status: 401, json: async () => ({}) });
    const result = await api.subjects.list();

    expect(result).toBeUndefined();
    expect(localStorage.getItem('ebbing_session')).toBeNull();
    expect(clearSpy).toHaveBeenCalledWith(undefined);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('401 em /api/auth/* NÃO recarrega — lança Error com detail', async () => {
    localStorage.setItem(
      'ebbing_session',
      JSON.stringify({ email: 'a@b.com', token: 't', role: 'USER', timestamp: Date.now() }),
    );
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    });

    mockFetchOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'credenciais inválidas' }),
    });

    await expect(api.auth.login('a@b.com', 'wrong')).rejects.toThrow('credenciais inválidas');
    expect(reloadMock).not.toHaveBeenCalled();
    // session preservada
    expect(localStorage.getItem('ebbing_session')).not.toBeNull();
  });

  it('401 sem sessão NÃO recarrega — lança Error', async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    });

    mockFetchOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'sem token' }),
    });

    await expect(api.subjects.list()).rejects.toThrow('sem token');
    expect(reloadMock).not.toHaveBeenCalled();
  });
});

describe('endpoints — URL, método e body', () => {
  beforeEach(() => {
    mockFetchDefault({ ok: true, status: 200, json: async () => [] });
  });

  it('api.auth.login: POST /api/auth/login', async () => {
    await api.auth.login('e@x.com', 'pw');
    expect(calls[0].url).toBe(`${BASE_URL}/api/auth/login`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(JSON.stringify({ email: 'e@x.com', password: 'pw' }));
  });

  it('api.auth.forgotPassword: POST /api/auth/forgot-password', async () => {
    await api.auth.forgotPassword('e@x.com');
    expect(calls[0].url).toBe(`${BASE_URL}/api/auth/forgot-password`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(JSON.stringify({ email: 'e@x.com' }));
  });

  it('api.auth.resetPassword: POST /api/auth/reset-password', async () => {
    await api.auth.resetPassword('tok', 'newpw');
    expect(calls[0].url).toBe(`${BASE_URL}/api/auth/reset-password`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(JSON.stringify({ token: 'tok', newPassword: 'newpw' }));
  });

  it('api.auth.signup: POST /api/auth/signup', async () => {
    await api.auth.signup('novo@x.com', 'senhaForte1');
    expect(calls[0].url).toBe(`${BASE_URL}/api/auth/signup`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(
      JSON.stringify({ email: 'novo@x.com', password: 'senhaForte1' }),
    );
  });

  it('api.auth.verifyEmail: POST /api/auth/verify-email', async () => {
    await api.auth.verifyEmail('tok-123');
    expect(calls[0].url).toBe(`${BASE_URL}/api/auth/verify-email`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(JSON.stringify({ token: 'tok-123' }));
  });

  it('api.admin.users.list: GET /api/admin/users', async () => {
    await api.admin.users.list();
    expect(calls[0].url).toBe(`${BASE_URL}/api/admin/users`);
    expect(calls[0].init.method).toBeUndefined();
  });

  it('api.admin.users.create: POST /api/admin/users', async () => {
    await api.admin.users.create({ email: 'x@y.com' } as never);
    expect(calls[0].url).toBe(`${BASE_URL}/api/admin/users`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(JSON.stringify({ email: 'x@y.com' }));
  });

  it('api.admin.users.update: PUT /api/admin/users/:id', async () => {
    await api.admin.users.update('42', { email: 'x@y.com' } as never);
    expect(calls[0].url).toBe(`${BASE_URL}/api/admin/users/42`);
    expect(calls[0].init.method).toBe('PUT');
  });

  it('api.admin.users.delete: DELETE /api/admin/users/:id', async () => {
    await api.admin.users.delete('42');
    expect(calls[0].url).toBe(`${BASE_URL}/api/admin/users/42`);
    expect(calls[0].init.method).toBe('DELETE');
  });

  it('api.subjects.list: GET /api/subjects', async () => {
    await api.subjects.list();
    expect(calls[0].url).toBe(`${BASE_URL}/api/subjects`);
    expect(calls[0].init.method).toBeUndefined();
  });

  it('api.subjects.sync: POST /api/subjects/sync', async () => {
    await api.subjects.sync([{ id: 'a' }]);
    expect(calls[0].url).toBe(`${BASE_URL}/api/subjects/sync`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(JSON.stringify([{ id: 'a' }]));
  });

  it('api.subjects.upsert: PUT /api/subjects/:id', async () => {
    await api.subjects.upsert('abc', { name: 'x' });
    expect(calls[0].url).toBe(`${BASE_URL}/api/subjects/abc`);
    expect(calls[0].init.method).toBe('PUT');
  });

  it('api.subjects.delete: DELETE /api/subjects/:id', async () => {
    await api.subjects.delete('abc');
    expect(calls[0].url).toBe(`${BASE_URL}/api/subjects/abc`);
    expect(calls[0].init.method).toBe('DELETE');
  });

  it('api.areas.list: GET /api/areas', async () => {
    await api.areas.list();
    expect(calls[0].url).toBe(`${BASE_URL}/api/areas`);
  });

  it('api.areas.create: POST /api/areas', async () => {
    await api.areas.create('Matemática');
    expect(calls[0].url).toBe(`${BASE_URL}/api/areas`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(JSON.stringify({ name: 'Matemática' }));
  });

  it('api.areas.update: PUT /api/areas/:id', async () => {
    await api.areas.update(7, 'Nova');
    expect(calls[0].url).toBe(`${BASE_URL}/api/areas/7`);
    expect(calls[0].init.method).toBe('PUT');
    expect(calls[0].init.body).toBe(JSON.stringify({ name: 'Nova' }));
  });

  it('api.areas.delete: DELETE /api/areas/:id', async () => {
    await api.areas.delete(7);
    expect(calls[0].url).toBe(`${BASE_URL}/api/areas/7`);
    expect(calls[0].init.method).toBe('DELETE');
  });

  it('api.disciplines.list sem areaId: GET /api/disciplines', async () => {
    await api.disciplines.list();
    expect(calls[0].url).toBe(`${BASE_URL}/api/disciplines`);
  });

  it('api.disciplines.list com areaId: GET /api/disciplines?areaId=5', async () => {
    await api.disciplines.list(5);
    expect(calls[0].url).toBe(`${BASE_URL}/api/disciplines?areaId=5`);
  });

  it('api.disciplines.create: POST /api/disciplines', async () => {
    await api.disciplines.create(1, 'Álgebra');
    expect(calls[0].url).toBe(`${BASE_URL}/api/disciplines`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(JSON.stringify({ areaId: 1, name: 'Álgebra' }));
  });

  it('api.disciplines.update: PUT /api/disciplines/:id', async () => {
    await api.disciplines.update(2, 'Nova');
    expect(calls[0].url).toBe(`${BASE_URL}/api/disciplines/2`);
    expect(calls[0].init.method).toBe('PUT');
  });

  it('api.disciplines.delete: DELETE /api/disciplines/:id', async () => {
    await api.disciplines.delete(2);
    expect(calls[0].url).toBe(`${BASE_URL}/api/disciplines/2`);
    expect(calls[0].init.method).toBe('DELETE');
  });

  it('api.reviewEvents.list: GET /api/review-events', async () => {
    await api.reviewEvents.list();
    expect(calls[0].url).toBe(`${BASE_URL}/api/review-events`);
  });

  it('api.reviewEvents.create: POST /api/review-events', async () => {
    const payload = {
      subjectId: 'abc',
      subjectName: 'Tópico',
      reviewDate: '2026-01-01',
      performance: 'bom',
      reps: 1,
      questions: 10,
      accuracy: 80,
      durationSeconds: 600,
    };
    await api.reviewEvents.create(payload);
    expect(calls[0].url).toBe(`${BASE_URL}/api/review-events`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(JSON.stringify(payload));
  });

  it('api.subjectTemplates.list sem disciplina: GET /api/subject-templates', async () => {
    await api.subjectTemplates.list();
    expect(calls[0].url).toBe(`${BASE_URL}/api/subject-templates`);
  });

  it('api.subjectTemplates.list com disciplina: encoda querystring', async () => {
    await api.subjectTemplates.list('Álgebra Linear');
    expect(calls[0].url).toBe(
      `${BASE_URL}/api/subject-templates?disciplina=${encodeURIComponent('Álgebra Linear')}`,
    );
  });

  it('api.routine.list: GET /api/routine', async () => {
    await api.routine.list();
    expect(calls[0].url).toBe(`${BASE_URL}/api/routine`);
  });

  it('api.routine.save: PUT /api/routine', async () => {
    const slots = [{ dayOfWeek: 1, slot: 'morning' }] as never;
    await api.routine.save(slots);
    expect(calls[0].url).toBe(`${BASE_URL}/api/routine`);
    expect(calls[0].init.method).toBe('PUT');
    expect(calls[0].init.body).toBe(JSON.stringify(slots));
  });

  it('api.preferences.get: GET /api/preferences', async () => {
    await api.preferences.get();
    expect(calls[0].url).toBe(`${BASE_URL}/api/preferences`);
  });

  it('api.preferences.save: PUT /api/preferences', async () => {
    await api.preferences.save({ allowedReviewDays: [1, 2, 3] });
    expect(calls[0].url).toBe(`${BASE_URL}/api/preferences`);
    expect(calls[0].init.method).toBe('PUT');
    expect(calls[0].init.body).toBe(JSON.stringify({ allowedReviewDays: [1, 2, 3] }));
  });

  it('api.examEntries.list: GET /api/exam-entries', async () => {
    await api.examEntries.list();
    expect(calls[0].url).toBe(`${BASE_URL}/api/exam-entries`);
  });

  it('api.examEntries.create: POST /api/exam-entries', async () => {
    const payload = {
      examDate: '2026-01-01',
      examName: 'Simulado',
      scorePercent: 75,
    };
    await api.examEntries.create(payload);
    expect(calls[0].url).toBe(`${BASE_URL}/api/exam-entries`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(JSON.stringify(payload));
  });

  it('api.examEntries.update: PUT /api/exam-entries/:id', async () => {
    await api.examEntries.update(9, { scorePercent: 90 });
    expect(calls[0].url).toBe(`${BASE_URL}/api/exam-entries/9`);
    expect(calls[0].init.method).toBe('PUT');
    expect(calls[0].init.body).toBe(JSON.stringify({ scorePercent: 90 }));
  });

  it('api.examEntries.delete: DELETE /api/exam-entries/:id', async () => {
    await api.examEntries.delete(9);
    expect(calls[0].url).toBe(`${BASE_URL}/api/exam-entries/9`);
    expect(calls[0].init.method).toBe('DELETE');
  });
});
