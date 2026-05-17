import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSubjects } from '../../src/hooks/useSubjects';
import { api } from '../../src/services/api';
import * as storage from '../../src/services/storage';
import type { Subject, StudentRoutine, RoutineSlot } from '../../src/types';

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
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
  },
}));

const mockApi = api as any;

function makeSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: 'sub-mat',
    modulo: 'Mod',
    area: 'Matemática',
    aulaPrincipal: 'Funções',
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

function slot(overrides: Partial<RoutineSlot> = {}): RoutineSlot {
  return {
    id: 's-' + Math.random().toString(36).slice(2),
    dayOfWeek: 4,
    title: 'Estudo Mat',
    type: 'study',
    area: 'Matemática',
    ...overrides,
  };
}

describe('useSubjects + routine integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('registerReview snapa nextReviewDate para um dia da rotina', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    const existing = makeSubject();
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.list.mockResolvedValue([existing]);

    // Rotina: estuda Matemática só na quinta (dayOfWeek=4)
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];

    const { result } = renderHook(() => useSubjects(routine, 'u@e.com'));

    await waitFor(() => {
      expect(result.current.subjects.find((s) => s.id === existing.id)).toBeDefined();
    });

    await act(async () => {
      result.current.registerReview(existing.id, 8, 10, 80);
    });

    const updated = result.current.subjects.find((s) => s.id === existing.id)!;
    expect(updated.nextReviewDate).toBeTruthy();

    // A data resultante DEVE cair numa quinta-feira (dayOfWeek === 4),
    // independente do que o FSRS calculou.
    const dow = new Date(updated.nextReviewDate + 'T12:00:00').getDay();
    expect(dow).toBe(4);
  });

  it('registerFixacao também respeita a rotina', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    const existing = makeSubject({ id: 'sub-fix' });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.list.mockResolvedValue([existing]);

    // Estuda Mat só na segunda (dayOfWeek=1)
    const routine: StudentRoutine = [slot({ dayOfWeek: 1, area: 'Matemática' })];

    const { result } = renderHook(() => useSubjects(routine, 'u@e.com'));

    await waitFor(() => {
      expect(result.current.subjects.find((s) => s.id === existing.id)).toBeDefined();
    });

    await act(async () => {
      result.current.registerFixacao(existing.id, 8, 10, 80);
    });

    const updated = result.current.subjects.find((s) => s.id === existing.id)!;
    expect(updated.nextReviewDate).toBeTruthy();
    const dow = new Date(updated.nextReviewDate + 'T12:00:00').getDay();
    expect(dow).toBe(1);
    expect(updated.flashcardsFeitos).toBe(true);
  });

  it('callback usa a rotina nova após re-render (fix das deps do #21)', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    const existing = makeSubject({ id: 'sub-rerender' });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.list.mockResolvedValue([existing]);

    // Rotina inicial: quinta
    const routineA: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    // Rotina nova: sexta (dayOfWeek=5)
    const routineB: StudentRoutine = [slot({ dayOfWeek: 5, area: 'Matemática' })];

    const { result, rerender } = renderHook(
      ({ routine }: { routine: StudentRoutine }) => useSubjects(routine, 'u@e.com'),
      { initialProps: { routine: routineA } },
    );

    await waitFor(() => {
      expect(result.current.subjects.find((s) => s.id === existing.id)).toBeDefined();
    });

    // Re-renderiza com a rotina NOVA antes de chamar registerReview
    rerender({ routine: routineB });

    await act(async () => {
      result.current.registerReview(existing.id, 8, 10, 80);
    });

    const updated = result.current.subjects.find((s) => s.id === existing.id)!;
    const dow = new Date(updated.nextReviewDate + 'T12:00:00').getDay();
    // Deve usar a rotina NOVA (sexta), não a antiga (quinta)
    expect(dow).toBe(5);
  });
});
