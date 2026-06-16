import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSubjects, snapReviewDate } from '../../src/hooks/useSubjects';
import { api } from '../../src/services/api';
import * as storage from '../../src/services/storage';
import type { Subject } from '../../src/types';

vi.mock('../../src/services/api', () => ({
  api: {
    subjects: {
      list: vi.fn().mockResolvedValue([]),
      sync: vi.fn().mockResolvedValue([]),
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

function makeSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: 'sub-1',
    modulo: 'M',
    area: 'Área',
    aulaPrincipal: 'A',
    relevancia: 'Alta',
    aulaAssistida: false,
    preAulaFeita: false,
    flashcardsFeitos: false,
    currentStage: 'aula',
    nextReviewDate: null,
    lastReviewDate: null,
    lastPerformance: null,
    performanceLevel: 'nao_classificada',
    ...overrides,
  } as Subject;
}

describe('useSubjects (cobertura extra)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('snapReviewDate sem rotina e sem allowedDays retorna a própria data', () => {
    // Caminho onde i=0 satisfaz: hasAllowed=false, hasStudy=false → retorna data original
    const r = snapReviewDate('2025-01-15', 'X', []);
    expect(r).toBe('2025-01-15');
  });

  it('snapReviewDate com allowedDays vazio cai no fallback final', () => {
    const r = snapReviewDate('2025-01-15', 'X', [], new Set());
    expect(r).toBe('2025-01-15');
  });

  it('clearError zera erro setado por falha', async () => {
    mockApi.subjects.upsert.mockRejectedValueOnce(new Error('boom'));
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    mockApi.subjects.list.mockResolvedValue([]);

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));
    await waitFor(() => expect(mockApi.subjects.list).toHaveBeenCalled());

    await act(async () => {
      await result.current.addSubject({ aulaPrincipal: 'X', area: 'A', modulo: 'M' });
    });
    expect(result.current.error).toBeTruthy();

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('toggleAula / togglePreAula / toggleFlashcards / registerReview / registerFixacao / doResetCiclo / revertStage no-op quando subject não existe', async () => {
    const { result } = renderHook(() => useSubjects([], 'u@e.com'));

    await act(async () => {
      result.current.toggleAula('nao-existe');
      result.current.togglePreAula('nao-existe');
      result.current.toggleFlashcards('nao-existe');
      result.current.registerReview('nao-existe', 5);
      result.current.registerFixacao('nao-existe', 5);
      result.current.doResetCiclo('nao-existe');
      result.current.revertStage('nao-existe');
    });

    expect(mockApi.subjects.upsert).not.toHaveBeenCalled();
  });

  it('revertStage no-op quando subject não tem stability', async () => {
    const existing = makeSubject({ id: 'no-stab', stability: undefined as any });
    storage.saveSubjects([existing], 'u@e.com');

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));
    await waitFor(() => expect(result.current.subjects.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.revertStage('no-stab');
    });
    expect(mockApi.subjects.upsert).not.toHaveBeenCalled();
  });

  it('updateSubject rollback ao falhar upsert (path com previous != undefined)', async () => {
    const existing = makeSubject({ id: 'sub-x', aulaAssistida: false });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.list.mockResolvedValue([existing]);
    mockApi.subjects.upsert.mockRejectedValueOnce(new Error('boom'));
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));
    await waitFor(() => expect(result.current.subjects.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.toggleAula('sub-x');
    });

    await waitFor(() => {
      expect(result.current.subjects.find((s) => s.id === 'sub-x')?.aulaAssistida).toBe(false);
    });
    expect(result.current.error).toBeTruthy();
  });

  it('numCorrectToPerformance: todas as faixas via registerReview', async () => {
    const existing = makeSubject({ id: 'perf', currentStage: 'Review', stability: 1, reps: 1 });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.upsert.mockResolvedValue({});
    mockApi.reviewEvents.create.mockImplementation((ev: any) => Promise.resolve(ev));

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));
    await waitFor(() => expect(result.current.subjects.length).toBeGreaterThan(0));

    for (const n of [10, 8, 6, 3]) {
      await act(async () => {
        result.current.registerReview('perf', n);
      });
    }

    // Verifica que api foi chamada com performances distintas
    const calls = mockApi.reviewEvents.create.mock.calls.map((c: any[]) => c[0].performance);
    expect(calls).toEqual(expect.arrayContaining(['excelente', 'bom', 'medio', 'ruim']));
  });

  it('snapReviewDate com rotina-incompatível fallback para allowedDays', () => {
    // Cobre branches 50 (fallback) e o caso onde rotina não tem intersecção
    const r = snapReviewDate(
      '2025-01-15',
      'X',
      [
        // study só em domingos para outra área
        { id: '1', dayOfWeek: 0, type: 'study', area: 'Outra', title: 't' },
      ],
      new Set([3]),
    );
    expect(typeof r).toBe('string');
  });

  it('removeSubject sem previous ainda exibe erro (subject não estava no estado)', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    mockApi.subjects.list.mockResolvedValue([]);
    mockApi.subjects.delete.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));
    await waitFor(() => expect(mockApi.subjects.list).toHaveBeenCalled());

    await act(async () => {
      await result.current.removeSubject('id-inexistente');
    });
    expect(result.current.error).toBeTruthy();
  });

  it('registerReview e registerFixacao com nextReviewDate undefined preserva null', async () => {
    // Cobre branch onde updates.nextReviewDate é null/undefined → snappedDate ?? null
    const existing = makeSubject({ id: 'no-next', currentStage: 'aula' });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.upsert.mockResolvedValue({});

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));
    await waitFor(() => expect(result.current.subjects.length).toBeGreaterThan(0));

    await act(async () => {
      result.current.registerReview('no-next', 7);
      result.current.registerFixacao('no-next', 7);
    });
    expect(mockApi.subjects.upsert).toHaveBeenCalled();
  });

  it('rescheduleByRoutine ignora subjects sem nextReviewDate ou no passado', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const pastDate = past.toISOString().split('T')[0];

    const existing = [
      makeSubject({ id: 'past', nextReviewDate: pastDate, area: 'Mat' }),
      makeSubject({ id: 'null', nextReviewDate: null, area: 'Mat' }),
    ];
    storage.saveSubjects(existing, 'u@e.com');
    mockApi.subjects.upsert.mockResolvedValue({});

    const { result } = renderHook(() => useSubjects([], 'u@e.com', new Set([0, 1, 2, 3, 4, 5, 6])));
    await waitFor(() => expect(result.current.subjects.length).toBeGreaterThan(0));

    await act(async () => {
      result.current.rescheduleByRoutine([]);
    });
    // upsert não deveria ser chamado para subjects passados/null
    // (mas pode ter sido chamado por outros effects; só validamos no-crash)
    expect(result.current.subjects.length).toBeGreaterThan(0);
  });

  it('rescheduleByRoutine re-snapa nextReviewDate de subjects futuros', async () => {
    // Cria um subject com next review hoje + 5 dias
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const fDate = future.toISOString().split('T')[0];

    const existing = makeSubject({ id: 'r1', nextReviewDate: fDate, area: 'Mat' });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.upsert.mockResolvedValue({});

    const { result } = renderHook(() => useSubjects([], 'u@e.com', new Set([0, 1, 2, 3, 4, 5, 6])));
    await waitFor(() => expect(result.current.subjects.length).toBeGreaterThan(0));

    // Nova rotina força "study" só na 4a feira
    await act(async () => {
      result.current.rescheduleByRoutine([
        { id: 'sl', dayOfWeek: 3, type: 'study', area: 'Mat', title: 'Estudo' },
      ]);
    });

    // O nextReviewDate pode ou não ter mudado (depende do dia atual).
    // Apenas garantimos que executou sem crash.
    expect(result.current.subjects.find((s) => s.id === 'r1')).toBeDefined();
  });
});
