import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    // Fixa apenas o relógio (não os timers) numa data anterior às datas usadas
    // nos cenários abaixo. Sem isso, as nextReviewDate fixas (2026-05-27/30)
    // ficam no passado conforme o tempo avança e o efeito de re-snap as ignora
    // (guarda `nextReviewDate < today`), quebrando os testes por rot de data.
    // `toFake: ['Date']` mantém setTimeout/waitFor com timers reais.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-05-20T12:00:00'));
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('re-snapa automaticamente quando routine chega depois do fetch de subjects', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    // Subject já tem nextReviewDate desalinhada (uma quarta-feira, 2026-05-27)
    const existing = makeSubject({ id: 'sub-async', nextReviewDate: '2026-05-27' });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.list.mockResolvedValue([existing]);

    // Estuda Mat só na quinta (dayOfWeek=4)
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    const allowed = new Set([0, 1, 2, 3, 4, 5, 6]);

    const { result, rerender } = renderHook(
      ({ r, a }: { r: StudentRoutine; a: Set<number> | undefined }) => useSubjects(r, 'u@e.com', a),
      { initialProps: { r: [] as StudentRoutine, a: undefined as Set<number> | undefined } },
    );

    await waitFor(() => {
      expect(result.current.subjects.find((s) => s.id === existing.id)?.nextReviewDate).toBe(
        '2026-05-27',
      );
    });

    // Agora a rotina + allowedDays chegam (simulando fetch async no login)
    rerender({ r: routine, a: allowed });

    await waitFor(() => {
      const s = result.current.subjects.find((x) => x.id === existing.id)!;
      const dow = new Date(s.nextReviewDate + 'T12:00:00').getDay();
      expect(dow).toBe(4);
    });
  });

  it('não re-snapa subjects com nextReviewDate no passado', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    const pastDate = '2000-01-05'; // muito no passado
    const existing = makeSubject({ id: 'sub-past', nextReviewDate: pastDate });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.list.mockResolvedValue([existing]);

    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    const allowed = new Set([0, 1, 2, 3, 4, 5, 6]);

    const { result } = renderHook(() => useSubjects(routine, 'u@e.com', allowed));

    await waitFor(() => {
      expect(result.current.subjects.find((s) => s.id === existing.id)).toBeDefined();
    });

    // Aguarda qualquer efeito de snap rodar
    await new Promise((r) => setTimeout(r, 50));

    const s = result.current.subjects.find((x) => x.id === existing.id)!;
    expect(s.nextReviewDate).toBe(pastDate);
    expect(mockApi.subjects.upsert).not.toHaveBeenCalled();
  });

  it('subjects já alinhados não disparam updateSubject (sem loop)', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    // 2026-05-28 é quinta-feira (dayOfWeek=4) — já alinhada
    const existing = makeSubject({ id: 'sub-aligned', nextReviewDate: '2026-05-28' });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.list.mockResolvedValue([existing]);

    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    const allowed = new Set([0, 1, 2, 3, 4, 5, 6]);

    const { result } = renderHook(() => useSubjects(routine, 'u@e.com', allowed));

    await waitFor(() => {
      expect(result.current.subjects.find((s) => s.id === existing.id)).toBeDefined();
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockApi.subjects.upsert).not.toHaveBeenCalled();
  });

  it('re-snapa quando allowedDays exclui o dia atual da revisão (com rotina)', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    // 2026-05-30 é sábado (dayOfWeek=6). Subject de área SEM slot na rotina —
    // assim o snap inicial cai no fallback de allowedDays e mantém o sábado.
    const existing = makeSubject({
      id: 'sub-toggle-r',
      area: 'Filosofia',
      nextReviewDate: '2026-05-30',
    });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.list.mockResolvedValue([existing]);

    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    const allowedAll = new Set([0, 1, 2, 3, 4, 5, 6]);
    const allowedNoSat = new Set([0, 1, 2, 3, 4, 5]); // sem sábado

    const { result, rerender } = renderHook(
      ({ a }: { a: Set<number> }) => useSubjects(routine, 'u@e.com', a),
      { initialProps: { a: allowedAll } },
    );

    await waitFor(() => {
      expect(result.current.subjects.find((s) => s.id === existing.id)?.nextReviewDate).toBe(
        '2026-05-30',
      );
    });

    rerender({ a: allowedNoSat });

    await waitFor(() => {
      const s = result.current.subjects.find((x) => x.id === existing.id)!;
      const dow = new Date(s.nextReviewDate + 'T12:00:00').getDay();
      expect(dow).not.toBe(6);
      expect(s.nextReviewDate >= '2026-05-30').toBe(true);
    });
  });

  it('re-snapa quando allowedDays muda mesmo sem rotina configurada', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    // 2026-05-30 é sábado
    const existing = makeSubject({ id: 'sub-toggle-norout', nextReviewDate: '2026-05-30' });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.list.mockResolvedValue([existing]);

    const noRoutine: StudentRoutine = [];
    const allowedAll = new Set([0, 1, 2, 3, 4, 5, 6]);
    const allowedNoSat = new Set([0, 1, 2, 3, 4, 5]);

    const { result, rerender } = renderHook(
      ({ a }: { a: Set<number> }) => useSubjects(noRoutine, 'u@e.com', a),
      { initialProps: { a: allowedAll } },
    );

    await waitFor(() => {
      expect(result.current.subjects.find((s) => s.id === existing.id)?.nextReviewDate).toBe(
        '2026-05-30',
      );
    });

    rerender({ a: allowedNoSat });

    await waitFor(() => {
      const s = result.current.subjects.find((x) => x.id === existing.id)!;
      const dow = new Date(s.nextReviewDate + 'T12:00:00').getDay();
      expect(dow).not.toBe(6);
    });
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
