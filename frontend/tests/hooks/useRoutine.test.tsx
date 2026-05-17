import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useRoutine } from '../../src/hooks/useRoutine';
import type { StudentRoutine } from '../../src/types';

function keyFor(email: string | null): string {
  return `ebbing_routine_v1_${email ?? '_guest'}`;
}

function readStorage(email: string | null): StudentRoutine {
  const raw = localStorage.getItem(keyFor(email));
  return raw ? (JSON.parse(raw) as StudentRoutine) : [];
}

describe('useRoutine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('carrega rotina da chave do email no mount', () => {
    const slots: StudentRoutine = [
      { id: '1', dayOfWeek: 1, type: 'study', area: 'Matemática', title: 'Mat' },
    ];
    localStorage.setItem(keyFor('alice@x.com'), JSON.stringify(slots));

    const { result } = renderHook(() => useRoutine('alice@x.com'));

    expect(result.current.routine).toHaveLength(1);
    expect(result.current.routine[0].area).toBe('Matemática');
  });

  it('email null usa a chave do guest', () => {
    const slots: StudentRoutine = [
      { id: 'g1', dayOfWeek: 3, type: 'other', title: 'Academia' },
    ];
    localStorage.setItem(keyFor(null), JSON.stringify(slots));

    const { result } = renderHook(() => useRoutine(null));

    expect(result.current.routine).toHaveLength(1);
    expect(result.current.routine[0].title).toBe('Academia');
  });

  it('re-hidrata ao trocar de email (fix #19)', () => {
    const aliceSlots: StudentRoutine = [
      { id: 'a1', dayOfWeek: 1, type: 'study', area: 'Matemática', title: 'Alice Mat' },
    ];
    const bobSlots: StudentRoutine = [
      { id: 'b1', dayOfWeek: 2, type: 'study', area: 'Física', title: 'Bob Fis' },
      { id: 'b2', dayOfWeek: 4, type: 'other', title: 'Bob Outro' },
    ];
    localStorage.setItem(keyFor('alice@x.com'), JSON.stringify(aliceSlots));
    localStorage.setItem(keyFor('bob@x.com'), JSON.stringify(bobSlots));

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

  it('addSlot persiste e atualiza state', () => {
    const { result } = renderHook(() => useRoutine('user@x.com'));

    act(() => {
      result.current.addSlot({ dayOfWeek: 2, type: 'study', area: 'Física', title: 'Fis' });
    });

    expect(result.current.routine).toHaveLength(1);
    const added = result.current.routine[0];
    expect(added.id).toBeTruthy();
    expect(added.area).toBe('Física');

    const stored = readStorage('user@x.com');
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(added.id);
    expect(stored[0].area).toBe('Física');
  });

  it('updateSlot aplica patch parcial e persiste', () => {
    const { result } = renderHook(() => useRoutine('user@x.com'));

    act(() => {
      result.current.addSlot({ dayOfWeek: 2, type: 'study', area: 'Física', title: 'Fis' });
    });

    const id = result.current.routine[0].id;

    act(() => {
      result.current.updateSlot(id, { area: 'Química' });
    });

    expect(result.current.routine[0].area).toBe('Química');
    expect(result.current.routine[0].dayOfWeek).toBe(2); // preserva resto
    expect(result.current.routine[0].title).toBe('Fis');

    const stored = readStorage('user@x.com');
    expect(stored[0].area).toBe('Química');
    expect(stored[0].dayOfWeek).toBe(2);
  });

  it('removeSlot remove do state e do localStorage', () => {
    const { result } = renderHook(() => useRoutine('user@x.com'));

    act(() => {
      result.current.addSlot({ dayOfWeek: 1, type: 'study', area: 'Mat', title: 'M' });
    });

    const id = result.current.routine[0].id;

    act(() => {
      result.current.removeSlot(id);
    });

    expect(result.current.routine).toEqual([]);
    expect(readStorage('user@x.com')).toEqual([]);
  });

  it('localStorage corrompido não crasha e retorna []', () => {
    localStorage.setItem(keyFor('x@x.com'), '{not json');

    const { result } = renderHook(() => useRoutine('x@x.com'));

    expect(result.current.routine).toEqual([]);
  });
});
