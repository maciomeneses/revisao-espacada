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
});
