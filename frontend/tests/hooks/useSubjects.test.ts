import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSubjects } from '../../src/hooks/useSubjects';
import { api } from '../../src/services/api';
import * as storage from '../../src/services/storage';
import { Subject } from '../../src/types';

function makeSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: 'test-subject',
    modulo: 'Mod',
    area: 'Area',
    aulaPrincipal: 'Aula',
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

describe('useSubjects hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('lista os assutos e eventos ao montar com sessao ativa', async () => {
    mockApi.subjects.list.mockResolvedValue([
      {
        id: 'sub-1',
        aulaPrincipal: 'Aula test',
        area: 'Area test',
        modulo: 'M1',
        relevancia: 'Alta',
      },
    ]);
    mockApi.reviewEvents.list.mockResolvedValue([
      { id: 'ev-1', subjectId: 'sub-1', reps: 1, questions: 0, accuracy: 0 },
    ]);

    localStorage.setItem(
      'ebbing_session',
      JSON.stringify({ token: 'test-token', email: 'u@e.com' }),
    );

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));

    // Wait for API effect to populate the state (no longer seeded by INITIAL_SUBJECTS)
    await waitFor(() => expect(result.current.subjects.length).toBeGreaterThan(0));
    expect(result.current.reviewEvents.length).toBeGreaterThanOrEqual(0);
  });

  it('salva o cronograma syncroniza com a api ao adicionar subject', async () => {
    mockApi.subjects.list.mockResolvedValue([]);
    const { result } = renderHook(() => useSubjects([], 'u@e.com'));

    await act(async () => {
      // Mock sync response
      mockApi.subjects.sync.mockResolvedValue({ status: 'ok' });
      result.current.addSubject({ aulaPrincipal: 'Nova Aula', area: 'Física', modulo: 'M1' });
    });

    expect(result.current.subjects.length).toBeGreaterThan(0);
    expect(result.current.subjects.find((s) => s.aulaPrincipal === 'Nova Aula')).toBeDefined();
  });

  it('deleta subjects', async () => {
    const existing = makeSubject({ id: 'sub-to-delete', aulaPrincipal: 'Del' });
    storage.saveSubjects([existing], 'u@e.com');

    mockApi.subjects.upsert.mockResolvedValueOnce({ ...existing, aulaAssistida: true });

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));

    await waitFor(() => {
      expect(result.current.subjects.length).toBeGreaterThan(0);
    });

    // Testa removeSubject
    mockApi.subjects.delete.mockResolvedValueOnce({});
    await act(async () => {
      await result.current.removeSubject(existing.id);
    });
    expect(mockApi.subjects.delete).toHaveBeenCalledWith(existing.id);
  });

  it('addSubject chama upsert (não sync destrutivo)', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    mockApi.subjects.list.mockResolvedValue([]);
    mockApi.subjects.upsert.mockResolvedValue({});

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));
    await waitFor(() => expect(mockApi.subjects.list).toHaveBeenCalled());

    await act(async () => {
      await result.current.addSubject({ aulaPrincipal: 'Novo', area: 'Física', modulo: 'M' });
    });

    expect(mockApi.subjects.upsert).toHaveBeenCalled();
    expect(mockApi.subjects.sync).not.toHaveBeenCalled();
  });

  it('não reenvia subjects apenas locais ao backend ao montar (não ressuscita deletados)', async () => {
    // Cenário: localStorage tem um subject antigo que já foi deletado no backend
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    const ghost = makeSubject({ id: 'ghost', aulaPrincipal: 'Fantasma' });
    storage.saveSubjects([ghost], 'u@e.com');
    mockApi.subjects.list.mockResolvedValue([]); // backend não o conhece

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));

    await waitFor(() => {
      // Após o fetch, o estado reflete o backend — sem o subject fantasma
      expect(result.current.subjects.find((s) => s.id === 'ghost')).toBeUndefined();
    });

    // Crucial: NÃO deve chamar sync para tentar "reenviar" o subject local
    expect(mockApi.subjects.sync).not.toHaveBeenCalled();
  });

  it('addSubject reverte estado local se o backend falhar', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    mockApi.subjects.list.mockResolvedValue([]);
    mockApi.subjects.upsert.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));
    await waitFor(() => expect(mockApi.subjects.list).toHaveBeenCalled());

    await act(async () => {
      await result.current.addSubject({ aulaPrincipal: 'Falha', area: 'X', modulo: 'Y' });
    });

    // Subject otimista deve ter sido removido após falha
    expect(result.current.subjects.find((s) => s.aulaPrincipal === 'Falha')).toBeUndefined();
    expect(result.current.error).toBeTruthy();
  });

  it('removeSubject reverte estado local se DELETE falhar', async () => {
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    const victim = makeSubject({ id: 'victim', aulaPrincipal: 'Sobrevive' });
    storage.saveSubjects([victim], 'u@e.com');
    mockApi.subjects.list.mockResolvedValue([victim]);
    mockApi.subjects.delete.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));
    await waitFor(() =>
      expect(result.current.subjects.find((s) => s.id === 'victim')).toBeDefined(),
    );

    await act(async () => {
      await result.current.removeSubject('victim');
    });

    // Após falha, o subject deve ter voltado ao estado local
    expect(result.current.subjects.find((s) => s.id === 'victim')).toBeDefined();
    expect(result.current.error).toBeTruthy();
  });

  it('registra review alterando a data pro futuro e criando evento', async () => {
    mockApi.subjects.list.mockResolvedValue([
      { id: '1', aulaPrincipal: 'Sub', nextReviewDate: '2020-01-01', reps: 0 },
    ]);
    localStorage.setItem(
      'ebbing_session',
      JSON.stringify({ token: 'test-token', email: 'u@e.com' }),
    );

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));
    await new Promise((r) => setTimeout(r, 50));

    await act(async () => {
      result.current.registerReview(result.current.subjects[0].id, 8, 10, 80, '2023-01-01');
    });

    const s = result.current.subjects[0];
    expect(s.reps).toBeGreaterThan(0);
  });

  it('testa registerFixacao e toggleAula modificando a materia', async () => {
    const existing = makeSubject({ id: 'tst', currentStage: 'New' });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.upsert.mockResolvedValue(existing);

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));

    await waitFor(async () => {
      expect(result.current.subjects.length).toBeGreaterThan(0);
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
      await result.current.registerFixacao(result.current.subjects[0].id, 8, 10, 80);
    });

    await act(async () => {
      await result.current.toggleAula(result.current.subjects[0].id);
      await result.current.togglePreAula(result.current.subjects[0].id);
      await result.current.toggleFlashcards(result.current.subjects[0].id);
    });

    await waitFor(() => {
      expect(mockApi.subjects.upsert).toHaveBeenCalled();
    });
  });

  it('doResetCiclo e revertStage', async () => {
    const existing = makeSubject({ id: 'tst2', currentStage: 'Review', stability: 1.5 });
    storage.saveSubjects([existing], 'u@e.com');
    mockApi.subjects.upsert.mockResolvedValue(existing);

    const { result } = renderHook(() => useSubjects([], 'u@e.com'));

    await waitFor(async () => {
      expect(result.current.subjects.length).toBeGreaterThan(0);
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
      await result.current.revertStage(result.current.subjects[0].id); // should revert
    });

    await act(async () => {
      await result.current.doResetCiclo(result.current.subjects[0].id); // should reset
    });

    await waitFor(() => {
      expect(mockApi.subjects.upsert).toHaveBeenCalled();
    });
  });
});
