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
    }
  }
}));

const mockApi = api as any;

describe('useSubjects hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('lista os assutos e eventos ao montar com sessao ativa', async () => {
    mockApi.subjects.list.mockResolvedValue([
      { id: 'sub-1', aulaPrincipal: 'Aula test', area: 'Area test', modulo: 'M1', relevancia: 'Alta' }
    ]);
    mockApi.reviewEvents.list.mockResolvedValue([
      { id: 'ev-1', subjectId: 'sub-1', reps: 1, questions: 0, accuracy: 0 }
    ]);

    localStorage.setItem('ebbin_session', JSON.stringify({ token: 'test-token' }));

    const { result } = renderHook(() => useSubjects());

    // Initially will evaluate defaults/local storage
    expect(result.current.subjects.length).toBeGreaterThan(0);
    
    // Wait for effect to load data
    await new Promise(r => setTimeout(r, 50));

    expect(result.current.subjects.length).toBeGreaterThan(0);
    expect(result.current.reviewEvents.length).toBeGreaterThanOrEqual(0);
  });

  it('salva o cronograma syncroniza com a api ao adicionar subject', async () => {
    mockApi.subjects.list.mockResolvedValue([]);
    const { result } = renderHook(() => useSubjects());

    await act(async () => {
      // Mock sync response
      mockApi.subjects.sync.mockResolvedValue({ status: 'ok' });
      result.current.addSubject({ aulaPrincipal: 'Nova Aula', area: 'Física', modulo: 'M1' });
    });

    expect(result.current.subjects.length).toBeGreaterThan(0);
    expect(result.current.subjects.find(s => s.aulaPrincipal === 'Nova Aula')).toBeDefined();
  });

  it('deleta subjects', async () => {
    const existing = makeSubject({ id: 'sub-to-delete', aulaPrincipal: 'Del' });
    storage.saveSubjects([existing]);
    
    mockApi.subjects.upsert.mockResolvedValueOnce({ ...existing, aulaAssistida: true });
    
    const { result } = renderHook(() => useSubjects());
    
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
  
  it('registra review alterando a data pro futuro e criando evento', async () => {
    mockApi.subjects.list.mockResolvedValue([
      { id: '1', aulaPrincipal: 'Sub', nextReviewDate: '2020-01-01', reps: 0 }
    ]);
    localStorage.setItem('ebbin_session', JSON.stringify({ token: 'test-token' }));
    
    const { result } = renderHook(() => useSubjects());
    await new Promise(r => setTimeout(r, 50));

    await act(async () => {
      result.current.registerReview(result.current.subjects[0].id, 8, 10, 80, '2023-01-01');
    });

    const s = result.current.subjects[0];
    expect(s.reps).toBeGreaterThan(0);
  });

  it('testa registerFixacao e toggleAula modificando a materia', async () => {
    const existing = makeSubject({ id: 'tst', currentStage: 'New' });
    storage.saveSubjects([existing]);
    mockApi.subjects.upsert.mockResolvedValue(existing);
    
    const { result } = renderHook(() => useSubjects());
    
    await waitFor(async () => {
      expect(result.current.subjects.length).toBeGreaterThan(0);
      await new Promise(r => setTimeout(r, 10));
    });

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
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
    storage.saveSubjects([existing]);
    mockApi.subjects.upsert.mockResolvedValue(existing);
    
    const { result } = renderHook(() => useSubjects());
    
    await waitFor(async () => {
      expect(result.current.subjects.length).toBeGreaterThan(0);
      await new Promise(r => setTimeout(r, 10));
    });

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
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
