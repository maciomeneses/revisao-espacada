import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRoutine } from '../../src/hooks/useRoutine';
import { api } from '../../src/services/api';
import type { StudentRoutine } from '../../src/types';

vi.mock('../../src/services/api', () => ({
  api: {
    routine: {
      list: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue([]),
    },
  },
}));

const mockApi = api as any;

const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

function v1Key(email: string): string {
  return `ebbing_routine_v1_${email}`;
}

describe('useRoutine (cobertura extra)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockApi.routine.list.mockResolvedValue([]);
    mockApi.routine.save.mockResolvedValue([]);
  });

  it('list não-array é ignorado (sem efeitos colaterais)', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ email: 'u@x.com', token: 't' }));
    mockApi.routine.list.mockResolvedValueOnce({ foo: 'bar' } as any);

    const { result } = renderHook(() => useRoutine('u@x.com'));
    await waitFor(() => expect(mockApi.routine.list).toHaveBeenCalled());

    expect(result.current.routine).toEqual([]);
  });

  it('api.routine.list rejeitando apenas loga erro (sem crash)', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ email: 'u@x.com', token: 't' }));
    mockApi.routine.list.mockRejectedValueOnce(new Error('500'));

    const { result } = renderHook(() => useRoutine('u@x.com'));
    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(result.current.routine).toEqual([]);
  });

  it('legacy v1 corrompido retorna null (catch interno)', async () => {
    localStorage.setItem(v1Key('m@x.com'), '{nao json');
    localStorage.setItem('ebbing_session', JSON.stringify({ email: 'm@x.com', token: 't' }));
    mockApi.routine.list.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useRoutine('m@x.com'));
    await waitFor(() => expect(mockApi.routine.list).toHaveBeenCalled());
    expect(result.current.routine).toEqual([]);
  });

  it('migração v1: api.save falha apenas loga (sem crash)', async () => {
    const legacy: StudentRoutine = [
      { id: 'old1', dayOfWeek: 2, type: 'study', area: 'Hist', title: 'História' },
    ];
    localStorage.setItem(v1Key('m@x.com'), JSON.stringify(legacy));
    localStorage.setItem('ebbing_session', JSON.stringify({ email: 'm@x.com', token: 't' }));
    mockApi.routine.list.mockResolvedValueOnce([]);
    mockApi.routine.save.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useRoutine('m@x.com'));
    await waitFor(() => expect(mockApi.routine.save).toHaveBeenCalled());
    // estado ainda assume migration localmente
    expect(result.current.routine).toEqual(legacy);
  });

  it('addSlot sem sessão ativa não chama api.save', () => {
    // email mas sem session em localStorage
    const { result } = renderHook(() => useRoutine('u@x.com'));
    act(() => {
      result.current.addSlot({ dayOfWeek: 1, type: 'study', area: 'M', title: 'T' });
    });
    expect(mockApi.routine.save).not.toHaveBeenCalled();
    expect(result.current.routine).toHaveLength(1);
  });
});
