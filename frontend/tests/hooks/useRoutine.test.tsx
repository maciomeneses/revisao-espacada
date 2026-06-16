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

const mockApi = api as unknown as {
  routine: {
    list: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
};

function v2Key(email: string | null): string {
  return `ebbing_routine_v2_${email ?? '_guest'}`;
}

function v1Key(email: string | null): string {
  return `ebbing_routine_v1_${email ?? '_guest'}`;
}

function readV2(email: string | null): StudentRoutine {
  const raw = localStorage.getItem(v2Key(email));
  return raw ? (JSON.parse(raw) as StudentRoutine) : [];
}

function setSession(email: string): void {
  localStorage.setItem('ebbing_session', JSON.stringify({ email, token: 't' }));
}

describe('useRoutine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.routine.list.mockResolvedValue([]);
    mockApi.routine.save.mockResolvedValue([]);
    localStorage.clear();
  });

  it('carrega rotina do cache v2 no mount', () => {
    const slots: StudentRoutine = [
      { id: '1', dayOfWeek: 1, type: 'study', area: 'Matemática', title: 'Mat' },
    ];
    localStorage.setItem(v2Key('alice@x.com'), JSON.stringify(slots));

    const { result } = renderHook(() => useRoutine('alice@x.com'));

    expect(result.current.routine).toHaveLength(1);
    expect(result.current.routine[0].area).toBe('Matemática');
  });

  it('email null usa a chave do guest e não chama a API', async () => {
    const slots: StudentRoutine = [{ id: 'g1', dayOfWeek: 3, type: 'other', title: 'Academia' }];
    localStorage.setItem(v2Key(null), JSON.stringify(slots));

    const { result } = renderHook(() => useRoutine(null));

    expect(result.current.routine).toHaveLength(1);
    expect(result.current.routine[0].title).toBe('Academia');
    expect(mockApi.routine.list).not.toHaveBeenCalled();
  });

  it('re-hidrata ao trocar de email (fix #19)', () => {
    const aliceSlots: StudentRoutine = [
      { id: 'a1', dayOfWeek: 1, type: 'study', area: 'Matemática', title: 'Alice Mat' },
    ];
    const bobSlots: StudentRoutine = [
      { id: 'b1', dayOfWeek: 2, type: 'study', area: 'Física', title: 'Bob Fis' },
      { id: 'b2', dayOfWeek: 4, type: 'other', title: 'Bob Outro' },
    ];
    localStorage.setItem(v2Key('alice@x.com'), JSON.stringify(aliceSlots));
    localStorage.setItem(v2Key('bob@x.com'), JSON.stringify(bobSlots));

    const { result, rerender } = renderHook(
      ({ email }: { email: string | null }) => useRoutine(email),
      { initialProps: { email: 'alice@x.com' as string | null } },
    );

    expect(result.current.routine).toHaveLength(1);
    expect(result.current.routine[0].title).toBe('Alice Mat');

    rerender({ email: 'bob@x.com' });

    expect(result.current.routine).toHaveLength(2);
    expect(result.current.routine.map((s) => s.title)).toEqual(['Bob Fis', 'Bob Outro']);
  });

  it('addSlot persiste em cache v2 e chama api.routine.save', async () => {
    setSession('user@x.com');
    const { result } = renderHook(() => useRoutine('user@x.com'));

    await waitFor(() => expect(mockApi.routine.list).toHaveBeenCalled());

    act(() => {
      result.current.addSlot({ dayOfWeek: 2, type: 'study', area: 'Física', title: 'Fis' });
    });

    expect(result.current.routine).toHaveLength(1);
    const added = result.current.routine[0];
    expect(added.id).toBeTruthy();
    expect(added.area).toBe('Física');

    const stored = readV2('user@x.com');
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(added.id);

    expect(mockApi.routine.save).toHaveBeenCalledTimes(1);
    expect(mockApi.routine.save.mock.calls[0][0]).toEqual([added]);
  });

  it('updateSlot aplica patch parcial, persiste e chama save', async () => {
    setSession('user@x.com');
    const { result } = renderHook(() => useRoutine('user@x.com'));

    await waitFor(() => expect(mockApi.routine.list).toHaveBeenCalled());

    act(() => {
      result.current.addSlot({ dayOfWeek: 2, type: 'study', area: 'Física', title: 'Fis' });
    });

    const id = result.current.routine[0].id;

    act(() => {
      result.current.updateSlot(id, { area: 'Química' });
    });

    expect(result.current.routine[0].area).toBe('Química');
    expect(result.current.routine[0].dayOfWeek).toBe(2);
    expect(result.current.routine[0].title).toBe('Fis');

    const stored = readV2('user@x.com');
    expect(stored[0].area).toBe('Química');

    expect(mockApi.routine.save).toHaveBeenCalledTimes(2);
  });

  it('removeSlot remove do state, do localStorage v2 e chama save', async () => {
    setSession('user@x.com');
    const { result } = renderHook(() => useRoutine('user@x.com'));

    await waitFor(() => expect(mockApi.routine.list).toHaveBeenCalled());

    act(() => {
      result.current.addSlot({ dayOfWeek: 1, type: 'study', area: 'Mat', title: 'M' });
    });

    const id = result.current.routine[0].id;

    act(() => {
      result.current.removeSlot(id);
    });

    expect(result.current.routine).toEqual([]);
    expect(readV2('user@x.com')).toEqual([]);
    expect(mockApi.routine.save).toHaveBeenLastCalledWith([]);
  });

  it('localStorage v2 corrompido não crasha e retorna []', () => {
    localStorage.setItem(v2Key('x@x.com'), '{not json');

    const { result } = renderHook(() => useRoutine('x@x.com'));

    expect(result.current.routine).toEqual([]);
  });

  it('API autoritativa: sobrescreve cache local com resposta do backend', async () => {
    const localCache: StudentRoutine = [
      { id: 'stale', dayOfWeek: 1, type: 'study', area: 'Stale', title: 'Stale' },
    ];
    localStorage.setItem(v2Key('alice@x.com'), JSON.stringify(localCache));

    const apiData: StudentRoutine = [
      { id: 'fresh', dayOfWeek: 3, type: 'study', area: 'Fresh', title: 'Fresh' },
    ];
    mockApi.routine.list.mockResolvedValueOnce(apiData);
    setSession('alice@x.com');

    const { result } = renderHook(() => useRoutine('alice@x.com'));

    await waitFor(() => expect(result.current.routine[0]?.id).toBe('fresh'));
    expect(readV2('alice@x.com')).toEqual(apiData);
  });

  it('migração v1 -> v2: envia para backend quando lista do backend é vazia', async () => {
    const legacy: StudentRoutine = [
      { id: 'old1', dayOfWeek: 2, type: 'study', area: 'Hist', title: 'História' },
    ];
    localStorage.setItem(v1Key('mig@x.com'), JSON.stringify(legacy));
    mockApi.routine.list.mockResolvedValueOnce([]);
    setSession('mig@x.com');

    const { result } = renderHook(() => useRoutine('mig@x.com'));

    await waitFor(() => expect(mockApi.routine.save).toHaveBeenCalled());
    expect(mockApi.routine.save).toHaveBeenCalledWith(legacy);
    expect(result.current.routine).toEqual(legacy);
    expect(readV2('mig@x.com')).toEqual(legacy);
  });

  it('migração v1 -> v2 NÃO ocorre quando backend já tem rotina', async () => {
    const legacy: StudentRoutine = [
      { id: 'old1', dayOfWeek: 2, type: 'study', area: 'X', title: 'X' },
    ];
    const apiData: StudentRoutine = [
      { id: 'srv1', dayOfWeek: 1, type: 'study', area: 'Y', title: 'Y' },
    ];
    localStorage.setItem(v1Key('mig@x.com'), JSON.stringify(legacy));
    mockApi.routine.list.mockResolvedValueOnce(apiData);
    setSession('mig@x.com');

    const { result } = renderHook(() => useRoutine('mig@x.com'));

    await waitFor(() => expect(result.current.routine[0]?.id).toBe('srv1'));
    expect(mockApi.routine.save).not.toHaveBeenCalled();
  });

  it('sem sessão ativa não dispara nem list nem save', () => {
    // sem setSession()
    const { result } = renderHook(() => useRoutine('user@x.com'));

    act(() => {
      result.current.addSlot({ dayOfWeek: 1, type: 'study', area: 'A', title: 'T' });
    });

    expect(result.current.routine).toHaveLength(1);
    expect(mockApi.routine.list).not.toHaveBeenCalled();
    expect(mockApi.routine.save).not.toHaveBeenCalled();
  });

  it('save falhando reverte state e cache (rollback)', async () => {
    setSession('user@x.com');
    const { result } = renderHook(() => useRoutine('user@x.com'));

    await waitFor(() => expect(mockApi.routine.list).toHaveBeenCalled());

    mockApi.routine.save.mockRejectedValueOnce(new Error('boom'));

    await act(async () => {
      result.current.addSlot({ dayOfWeek: 2, type: 'study', area: 'A', title: 'T' });
    });

    await waitFor(() => expect(result.current.routine).toEqual([]));
    expect(readV2('user@x.com')).toEqual([]);
  });
});
