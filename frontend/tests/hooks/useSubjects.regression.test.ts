import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSubjects } from '../../src/hooks/useSubjects';
import { api } from '../../src/services/api';
import type { Subject } from '../../src/types';

vi.mock('../../src/services/api', () => ({
  api: {
    subjects: {
      list: vi.fn().mockResolvedValue([]),
      sync: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      upsert: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    reviewEvents: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

const mockApi = api as any;

function fakeSubject(id: string): Subject {
  return {
    id,
    modulo: 'M',
    area: 'A',
    aulaPrincipal: `Aula ${id}`,
    relevancia: 'Alta',
    aulaAssistida: false,
    preAulaFeita: false,
    flashcardsFeitos: false,
    currentStage: 'aula',
    nextReviewDate: null,
    lastReviewDate: null,
    lastPerformance: null,
    performanceLevel: 'nao_classificada',
  } as Subject;
}

describe('useSubjects — regressão do bug 339→3 (#9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // #15
  it('login sem reload mostra subjects do backend (não deixa estado seedado de guest)', async () => {
    const backendList = Array.from({ length: 50 }, (_, i) => fakeSubject(`s${i}`));
    mockApi.subjects.list.mockResolvedValue(backendList);

    let userEmail: string | undefined = undefined;
    const { result, rerender } = renderHook(() => useSubjects([], userEmail));

    // Antes do login: estado vazio, sem chamadas à API
    expect(result.current.subjects).toEqual([]);
    expect(mockApi.subjects.list).not.toHaveBeenCalled();

    // Simula login: app define a sessão e atualiza userEmail
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'user@e.com' }));
    userEmail = 'user@e.com';
    rerender();

    await waitFor(() => {
      expect(result.current.subjects).toHaveLength(50);
    });
    expect(mockApi.subjects.list).toHaveBeenCalledTimes(1);
  });

  // #16
  it('troca de usuário recarrega a lista correta', async () => {
    const listA = [fakeSubject('a1'), fakeSubject('a2')];
    const listB = [fakeSubject('b1'), fakeSubject('b2'), fakeSubject('b3')];

    mockApi.subjects.list.mockResolvedValueOnce(listA).mockResolvedValueOnce(listB);

    let userEmail: string | undefined = 'a@e.com';
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'a@e.com' }));

    const { result, rerender } = renderHook(() => useSubjects([], userEmail));
    await waitFor(() => expect(result.current.subjects).toHaveLength(2));
    expect(result.current.subjects.map((s) => s.id)).toEqual(['a1', 'a2']);

    // Logout + login como B
    localStorage.removeItem('ebbing_session');
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'b@e.com' }));
    userEmail = 'b@e.com';
    rerender();

    await waitFor(() => expect(result.current.subjects).toHaveLength(3));
    expect(result.current.subjects.map((s) => s.id)).toEqual(['b1', 'b2', 'b3']);

    // Cache de B foi populado, e o estado não tem mais os ids de A
    expect(localStorage.getItem('revisaENEM_subjects_v2_b@e.com')).not.toBeNull();
    expect(result.current.subjects.find((s) => s.id === 'a1')).toBeUndefined();
  });

  // #17
  it('addSubject pós-login persiste no key do usuário, não no key de guest', async () => {
    mockApi.subjects.list.mockResolvedValue([]);
    mockApi.subjects.upsert.mockResolvedValue({});
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'foo@bar.com' }));

    const { result } = renderHook(() => useSubjects([], 'foo@bar.com'));
    await waitFor(() => expect(mockApi.subjects.list).toHaveBeenCalled());

    await act(async () => {
      await result.current.addSubject({
        aulaPrincipal: 'Persistência',
        area: 'FÍSICA',
        modulo: 'M',
      });
    });

    const userKey = localStorage.getItem('revisaENEM_subjects_v2_foo@bar.com');
    expect(userKey).not.toBeNull();
    const persisted = JSON.parse(userKey!);
    expect(persisted.find((s: Subject) => s.aulaPrincipal === 'Persistência')).toBeDefined();

    // Guest key (legado) não deve receber escritas
    expect(localStorage.getItem('revisaENEM_subjects_v1')).toBeNull();
  });
});
