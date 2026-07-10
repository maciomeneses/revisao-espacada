import { describe, it, expect } from 'vitest';
import { calculateNextReview, addDays, today, resetCiclo } from '../src/services/algorithm';
import type { Subject } from '../src/types';

describe('addDays', () => {
  it('adds days correctly', () => {
    const result = addDays(new Date(2026, 0, 1), 7);
    expect(result).toBe('2026-01-08');
  });

  it('handles month overflow', () => {
    const result = addDays(new Date(2026, 0, 28), 7);
    expect(result).toBe('2026-02-04');
  });
});

describe('FSRS v6 Algorithm', () => {
  const mockSubject: Subject = {
    id: '1',
    modulo: 'M1',
    area: 'A1',
    aulaPrincipal: 'Aula 1',
    relevancia: 'Alta',
    aulaAssistida: false,
    preAulaFeita: false,
    flashcardsFeitos: false,
    currentStage: 'aula',
    nextReviewDate: null,
    lastReviewDate: null,
    lastPerformance: null,
    performanceLevel: 'nao_classificada',
  };

  it('initializes stability correctly on first review (Good)', () => {
    const updates = calculateNextReview(mockSubject, 7); // Good (7/10)
    expect(updates.stability).toBeGreaterThan(0);
    expect(updates.state).toBe('Learning');
    expect(updates.reps).toBe(1);
    expect(updates.nextReviewDate).toBeDefined();
  });

  it('increases stability on subsequent Good reviews', () => {
    const firstUpdate = calculateNextReview(mockSubject, 7);
    const subjectAfterFirst = { ...mockSubject, ...firstUpdate } as Subject;

    // Simulate some time passed (e.g., the scheduled days)
    const later = new Date();
    later.setDate(later.getDate() + (firstUpdate.scheduledDays || 1));
    subjectAfterFirst.lastReviewDate = later.toISOString();

    const secondUpdate = calculateNextReview(subjectAfterFirst, 7);
    expect(secondUpdate.stability).toBeGreaterThan(subjectAfterFirst.stability!);
    expect(secondUpdate.reps).toBe(2);
  });

  it('decreases stability or resets state on Again review', () => {
    const firstUpdate = calculateNextReview(mockSubject, 7);
    const subjectAfterFirst = { ...mockSubject, ...firstUpdate } as Subject;

    const secondUpdate = calculateNextReview(subjectAfterFirst, 2); // Again (2/10)
    expect(secondUpdate.state).toBe('Relearning');
    expect(secondUpdate.lapses).toBe(1);
  });

  // O backend converte lastPerformance com PerformanceLevel.fromValue, que só
  // reconhece nomes de nível — dígitos ('1'..'4') degradariam silenciosamente
  // para 'nao_classificada'.
  it.each([
    [0, 'ruim'],
    [4, 'ruim'],
    [5, 'medio'],
    [6, 'medio'],
    [7, 'bom'],
    [8, 'bom'],
    [9, 'excelente'],
    [10, 'excelente'],
  ] as const)(
    'persiste o nome do nível em lastPerformance e performanceLevel (numCorrect=%i → %s)',
    (numCorrect, expected) => {
      const updates = calculateNextReview(mockSubject, numCorrect);
      expect(updates.lastPerformance).toBe(expected);
      expect(updates.performanceLevel).toBe(expected);
    },
  );

  it('nunca persiste dígitos em lastPerformance', () => {
    for (let numCorrect = 0; numCorrect <= 10; numCorrect++) {
      const updates = calculateNextReview(mockSubject, numCorrect);
      expect(updates.lastPerformance).not.toMatch(/^\d+$/);
    }
  });
});

describe('today', () => {
  it('returns today date in YYYY-MM-DD format', () => {
    const t = today();
    expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('resetCiclo', () => {
  it('resets subject to initial state', () => {
    const subject: Subject = {
      id: '1',
      modulo: 'M1',
      area: 'A1',
      aulaPrincipal: 'Aula 1',
      relevancia: 'Alta',
      aulaAssistida: true,
      preAulaFeita: true,
      flashcardsFeitos: true,
      currentStage: 'Review',
      nextReviewDate: '2026-01-01',
      lastReviewDate: '2026-01-01',
      lastPerformance: 'bom',
      performanceLevel: 'bom',
      stability: 10,
      difficulty: 5,
      reps: 5,
    };

    const reset = resetCiclo(subject);
    expect(reset.stability).toBe(0);
    expect(reset.reps).toBe(0);
    expect(reset.currentStage).toBe('aula');
    expect(reset.nextReviewDate).toBeNull();
  });
});
