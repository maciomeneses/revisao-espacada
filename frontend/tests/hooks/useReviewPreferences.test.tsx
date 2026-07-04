import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useReviewPreferences } from '../../src/hooks/useReviewPreferences';
import { api } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  api: {
    preferences: {
      get: vi.fn().mockResolvedValue({ allowedReviewDays: [0, 1, 2, 3, 4, 5, 6] }),
      save: vi.fn().mockResolvedValue({ allowedReviewDays: [0, 1, 2, 3, 4, 5, 6] }),
    },
  },
}));

const mockApi = api as unknown as {
  preferences: {
    get: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
};

function prefsKey(email: string | null): string {
  return `ebbing_prefs_v1_${email ?? '_guest'}`;
}

function setSession(email: string): void {
  localStorage.setItem('ebbing_session', JSON.stringify({ email, token: 't' }));
}

describe('useReviewPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.preferences.get.mockResolvedValue({ allowedReviewDays: [0, 1, 2, 3, 4, 5, 6] });
    mockApi.preferences.save.mockResolvedValue({ allowedReviewDays: [0, 1, 2, 3, 4, 5, 6] });
    localStorage.clear();
  });

  it('defaults: sem session e sem localStorage retorna todos os dias (0..6)', () => {
    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    expect(result.current.allowedDays).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
    expect(mockApi.preferences.get).not.toHaveBeenCalled();
  });

  it('carrega do localStorage no mount', () => {
    localStorage.setItem(prefsKey('alice@x.com'), JSON.stringify([1, 2, 3, 4, 5]));

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    expect(result.current.allowedDays).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(result.current.allowedDays.has(0)).toBe(false);
    expect(result.current.allowedDays.has(6)).toBe(false);
  });

  it('re-hidrata ao trocar email', () => {
    localStorage.setItem(prefsKey('alice@x.com'), JSON.stringify([1, 2, 3]));
    localStorage.setItem(prefsKey('bob@x.com'), JSON.stringify([4, 5, 6]));

    const { result, rerender } = renderHook(
      ({ email }: { email: string | null }) => useReviewPreferences(email),
      { initialProps: { email: 'alice@x.com' as string | null } },
    );

    expect(result.current.allowedDays).toEqual(new Set([1, 2, 3]));

    rerender({ email: 'bob@x.com' });

    expect(result.current.allowedDays).toEqual(new Set([4, 5, 6]));
  });

  it('busca do backend quando há session e sobrescreve cache local', async () => {
    localStorage.setItem(prefsKey('alice@x.com'), JSON.stringify([0, 6]));
    mockApi.preferences.get.mockResolvedValueOnce({ allowedReviewDays: [1, 2, 3, 4, 5] });
    setSession('alice@x.com');

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    await waitFor(() => expect(result.current.allowedDays).toEqual(new Set([1, 2, 3, 4, 5])));
    expect(mockApi.preferences.get).toHaveBeenCalledTimes(1);
  });

  it('setAllowedDays persiste no backend com lista ordenada', async () => {
    setSession('alice@x.com');
    mockApi.preferences.get.mockResolvedValueOnce({ allowedReviewDays: [0, 1, 2, 3, 4, 5, 6] });

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    await waitFor(() => expect(mockApi.preferences.get).toHaveBeenCalled());

    act(() => {
      result.current.setAllowedDays(new Set([5, 1, 3, 2, 4]));
    });

    expect(result.current.allowedDays).toEqual(new Set([1, 2, 3, 4, 5]));
    await waitFor(() => expect(mockApi.preferences.save).toHaveBeenCalled());
    expect(mockApi.preferences.save).toHaveBeenCalledWith({
      allowedReviewDays: [1, 2, 3, 4, 5],
      maxReviewsPerDay: null,
    });
  });

  it('rejeita Set vazio: state inalterado e save não é chamado', async () => {
    setSession('alice@x.com');

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    await waitFor(() => expect(mockApi.preferences.get).toHaveBeenCalled());
    mockApi.preferences.save.mockClear();

    const before = result.current.allowedDays;

    act(() => {
      result.current.setAllowedDays(new Set());
    });

    expect(result.current.allowedDays).toBe(before);
    expect(mockApi.preferences.save).not.toHaveBeenCalled();
  });

  it('toggleDay impede desligar o último dia', () => {
    localStorage.setItem(prefsKey('alice@x.com'), JSON.stringify([3]));

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    expect(result.current.allowedDays).toEqual(new Set([3]));

    act(() => {
      result.current.toggleDay(3);
    });

    expect(result.current.allowedDays).toEqual(new Set([3]));
  });

  it('toggleDay normal: desliga e liga dias', () => {
    localStorage.setItem(prefsKey('alice@x.com'), JSON.stringify([1, 2]));

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    expect(result.current.allowedDays).toEqual(new Set([1, 2]));

    act(() => {
      result.current.toggleDay(1);
    });

    expect(result.current.allowedDays).toEqual(new Set([2]));

    act(() => {
      result.current.toggleDay(5);
    });

    expect(result.current.allowedDays).toEqual(new Set([2, 5]));
  });

  it('rollback em falha de rede: state volta para o valor anterior', async () => {
    setSession('alice@x.com');
    mockApi.preferences.get.mockResolvedValueOnce({ allowedReviewDays: [0, 1, 2, 3, 4, 5, 6] });

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    await waitFor(() => expect(mockApi.preferences.get).toHaveBeenCalled());

    const previous = result.current.allowedDays;
    mockApi.preferences.save.mockRejectedValueOnce(new Error('boom'));

    await act(async () => {
      result.current.setAllowedDays(new Set([1, 2, 3]));
    });

    await waitFor(() => expect(result.current.allowedDays).toEqual(previous));
  });

  it('localStorage corrompido: hook não crasha e retorna defaults', () => {
    localStorage.setItem(prefsKey('x@x.com'), '{not json');

    const { result } = renderHook(() => useReviewPreferences('x@x.com'));

    expect(result.current.allowedDays).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
  });

  // ---- maxReviewsPerDay ----

  it('maxReviewsPerDay default é null (sem limite)', () => {
    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    expect(result.current.maxReviewsPerDay).toBeNull();
  });

  it('busca maxReviewsPerDay do backend junto com os dias', async () => {
    setSession('alice@x.com');
    mockApi.preferences.get.mockResolvedValueOnce({
      allowedReviewDays: [1, 2, 3],
      maxReviewsPerDay: 4,
    });

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    await waitFor(() => expect(result.current.maxReviewsPerDay).toBe(4));
    expect(result.current.allowedDays).toEqual(new Set([1, 2, 3]));
  });

  it('setMaxReviewsPerDay persiste dias atuais + limite no mesmo PUT', async () => {
    setSession('alice@x.com');
    mockApi.preferences.get.mockResolvedValueOnce({ allowedReviewDays: [1, 3, 5] });

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    await waitFor(() => expect(result.current.allowedDays).toEqual(new Set([1, 3, 5])));

    act(() => {
      result.current.setMaxReviewsPerDay(3);
    });

    expect(result.current.maxReviewsPerDay).toBe(3);
    await waitFor(() =>
      expect(mockApi.preferences.save).toHaveBeenCalledWith({
        allowedReviewDays: [1, 3, 5],
        maxReviewsPerDay: 3,
      }),
    );
  });

  it('setMaxReviewsPerDay(null) remove o limite', async () => {
    setSession('alice@x.com');
    mockApi.preferences.get.mockResolvedValueOnce({
      allowedReviewDays: [1, 2],
      maxReviewsPerDay: 5,
    });

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    await waitFor(() => expect(result.current.maxReviewsPerDay).toBe(5));

    act(() => {
      result.current.setMaxReviewsPerDay(null);
    });

    expect(result.current.maxReviewsPerDay).toBeNull();
    await waitFor(() =>
      expect(mockApi.preferences.save).toHaveBeenCalledWith({
        allowedReviewDays: [1, 2],
        maxReviewsPerDay: null,
      }),
    );
  });

  it('setMaxReviewsPerDay rejeita 0, negativos e não inteiros', async () => {
    setSession('alice@x.com');

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    await waitFor(() => expect(mockApi.preferences.get).toHaveBeenCalled());
    mockApi.preferences.save.mockClear();

    act(() => {
      result.current.setMaxReviewsPerDay(0);
      result.current.setMaxReviewsPerDay(-3);
      result.current.setMaxReviewsPerDay(2.5);
    });

    expect(result.current.maxReviewsPerDay).toBeNull();
    expect(mockApi.preferences.save).not.toHaveBeenCalled();
  });

  it('carrega maxReviewsPerDay do cache localStorage no mount', () => {
    localStorage.setItem('ebbing_prefs_max_v1_alice@x.com', '4');

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    expect(result.current.maxReviewsPerDay).toBe(4);
  });

  it('cache de maxReviewsPerDay inválido (não inteiro, < 1 ou corrompido) vira null', () => {
    localStorage.setItem('ebbing_prefs_max_v1_a@x.com', '"quatro"');
    expect(
      renderHook(() => useReviewPreferences('a@x.com')).result.current.maxReviewsPerDay,
    ).toBeNull();

    localStorage.setItem('ebbing_prefs_max_v1_b@x.com', '0');
    expect(
      renderHook(() => useReviewPreferences('b@x.com')).result.current.maxReviewsPerDay,
    ).toBeNull();

    localStorage.setItem('ebbing_prefs_max_v1_c@x.com', '2.5');
    expect(
      renderHook(() => useReviewPreferences('c@x.com')).result.current.maxReviewsPerDay,
    ).toBeNull();

    localStorage.setItem('ebbing_prefs_max_v1_d@x.com', '{not json');
    expect(
      renderHook(() => useReviewPreferences('d@x.com')).result.current.maxReviewsPerDay,
    ).toBeNull();
  });

  it('re-hidrata maxReviewsPerDay ao trocar de email', () => {
    localStorage.setItem('ebbing_prefs_max_v1_alice@x.com', '3');
    localStorage.setItem('ebbing_prefs_max_v1_bob@x.com', '7');

    const { result, rerender } = renderHook(
      ({ email }: { email: string | null }) => useReviewPreferences(email),
      { initialProps: { email: 'alice@x.com' as string | null } },
    );

    expect(result.current.maxReviewsPerDay).toBe(3);

    rerender({ email: 'bob@x.com' });

    expect(result.current.maxReviewsPerDay).toBe(7);
  });

  it('falha no GET de preferências mantém o cache local', async () => {
    localStorage.setItem(prefsKey('alice@x.com'), JSON.stringify([1, 2]));
    localStorage.setItem('ebbing_prefs_max_v1_alice@x.com', '5');
    setSession('alice@x.com');
    mockApi.preferences.get.mockRejectedValueOnce(new Error('rede fora'));

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    await waitFor(() => expect(mockApi.preferences.get).toHaveBeenCalled());
    expect(result.current.allowedDays).toEqual(new Set([1, 2]));
    expect(result.current.maxReviewsPerDay).toBe(5);
  });

  it('unmount antes da resposta do GET não aplica o resultado (cancelled)', async () => {
    setSession('alice@x.com');
    let resolveGet: (v: unknown) => void = () => {};
    mockApi.preferences.get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveGet = resolve;
      }),
    );

    const { unmount } = renderHook(() => useReviewPreferences('alice@x.com'));
    unmount();

    resolveGet({ allowedReviewDays: [1], maxReviewsPerDay: 9 });
    await Promise.resolve();

    // Estado não persiste no cache após unmount (branch `cancelled`)
    expect(localStorage.getItem('ebbing_prefs_max_v1_alice@x.com')).toBeNull();
  });

  it('sem sessão, setMaxReviewsPerDay altera estado local sem chamar a API', async () => {
    // email presente mas sem ebbing_session no localStorage
    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    act(() => {
      result.current.setMaxReviewsPerDay(6);
    });

    expect(result.current.maxReviewsPerDay).toBe(6);
    expect(mockApi.preferences.save).not.toHaveBeenCalled();
  });

  it('rollback do limite em falha de rede', async () => {
    setSession('alice@x.com');
    mockApi.preferences.get.mockResolvedValueOnce({
      allowedReviewDays: [1, 2],
      maxReviewsPerDay: 5,
    });

    const { result } = renderHook(() => useReviewPreferences('alice@x.com'));

    await waitFor(() => expect(result.current.maxReviewsPerDay).toBe(5));
    mockApi.preferences.save.mockRejectedValueOnce(new Error('boom'));

    await act(async () => {
      result.current.setMaxReviewsPerDay(2);
    });

    await waitFor(() => expect(result.current.maxReviewsPerDay).toBe(5));
  });
});
