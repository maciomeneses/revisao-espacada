import type { Performance, Relevance, ReviewStage, Subject } from '../types';

export interface StageTransition {
  nextStage: ReviewStage;
  daysUntilNext: number;
  /** false = resgate (retry same stage), true = stage passed */
  stageCompleted: boolean;
}

/**
 * Computes the next stage and schedule after completing a review stage.
 * Implements the spaced repetition algorithm described in the system document.
 */
export function computeStageTransition(
  currentStage: ReviewStage,
  relevance: Relevance,
  performance: Performance,
): StageTransition {
  switch (currentStage) {
    case 'aula':
      return { nextStage: 'fixacao', daysUntilNext: 1, stageCompleted: true };

    case 'fixacao':
      if (performance === 'lte_60') {
        return { nextStage: 'estudo_reverso', daysUntilNext: 1, stageCompleted: true };
      }
      return { nextStage: 'rev7d', daysUntilNext: 7, stageCompleted: true };

    case 'estudo_reverso':
      return { nextStage: 'rev7d', daysUntilNext: 7, stageCompleted: true };

    case 'rev7d':
      return computeRev7dTransition(relevance, performance);

    case 'rev30d':
      return computeRev30dTransition(relevance, performance);

    case 'rev60d':
      return computeRev60dTransition(performance);

    case 'rev90d':
      return computeRev90dTransition(performance);

    case 'concluido':
      return { nextStage: 'concluido', daysUntilNext: 0, stageCompleted: true };
  }
}

function computeRev7dTransition(relevance: Relevance, performance: Performance): StageTransition {
  if (relevance === 'Alta') {
    if (performance === 'lte_60') return { nextStage: 'rev7d', daysUntilNext: 7, stageCompleted: false };
    if (performance === 'range_61_79') return { nextStage: 'rev30d', daysUntilNext: 30, stageCompleted: true };
    return { nextStage: 'rev60d', daysUntilNext: 60, stageCompleted: true }; // ≥80% — skip to 60d
  }
  if (relevance === 'Média') {
    if (performance === 'lte_60') return { nextStage: 'rev7d', daysUntilNext: 14, stageCompleted: false };
    if (performance === 'range_61_79') return { nextStage: 'rev30d', daysUntilNext: 30, stageCompleted: true };
    return { nextStage: 'concluido', daysUntilNext: 0, stageCompleted: true }; // ≥80%
  }
  // Baixa
  if (performance === 'lte_60') return { nextStage: 'rev7d', daysUntilNext: 30, stageCompleted: false };
  return { nextStage: 'concluido', daysUntilNext: 0, stageCompleted: true };
}

function computeRev30dTransition(relevance: Relevance, performance: Performance): StageTransition {
  if (relevance === 'Alta') {
    if (performance === 'lte_60') return { nextStage: 'rev30d', daysUntilNext: 7, stageCompleted: false };
    if (performance === 'range_61_79') return { nextStage: 'rev60d', daysUntilNext: 60, stageCompleted: true };
    return { nextStage: 'rev90d', daysUntilNext: 90, stageCompleted: true }; // ≥80% — skip to 90d
  }
  // Média — Rev 30D is the final stage
  if (performance === 'lte_60') return { nextStage: 'rev30d', daysUntilNext: 14, stageCompleted: false };
  return { nextStage: 'concluido', daysUntilNext: 0, stageCompleted: true };
}

function computeRev60dTransition(performance: Performance): StageTransition {
  // Only Alta relevance reaches Rev 60D
  if (performance === 'lte_60') return { nextStage: 'rev60d', daysUntilNext: 7, stageCompleted: false };
  if (performance === 'range_61_79') return { nextStage: 'rev90d', daysUntilNext: 90, stageCompleted: true };
  return { nextStage: 'concluido', daysUntilNext: 0, stageCompleted: true }; // ≥80%
}

function computeRev90dTransition(performance: Performance): StageTransition {
  // Only Alta relevance reaches Rev 90D
  if (performance === 'lte_60') return { nextStage: 'rev90d', daysUntilNext: 7, stageCompleted: false };
  return { nextStage: 'concluido', daysUntilNext: 0, stageCompleted: true };
}

/** Adds days to a date and returns an ISO date string (YYYY-MM-DD). */
export function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

/** Returns today's date as an ISO date string (YYYY-MM-DD). */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** Computes the label for the next pending task. */
export function getProximaTarefa(stage: ReviewStage): string {
  const labels: Record<ReviewStage, string> = {
    aula: 'Aula',
    fixacao: 'Fixação 24H',
    estudo_reverso: 'Estudo Reverso',
    rev7d: 'Revisão 7 Dias',
    rev30d: 'Revisão 30 Dias',
    rev60d: 'Revisão 60 Dias',
    rev90d: 'Revisão 90 Dias',
    concluido: 'Concluído',
  };
  return labels[stage];
}

/** Returns the timing status relative to today. */
export function getFormulaStatus(subject: Subject): string {
  if (subject.currentStage === 'aula') return '';
  if (subject.currentStage === 'concluido') return 'Concluído';
  if (!subject.nextReviewDate) return '';

  const todayStr = today();
  if (subject.nextReviewDate < todayStr) return 'Atrasado';
  if (subject.nextReviewDate === todayStr) return 'Hoje';
  return 'No Prazo';
}

/**
 * Applies a "Resetar Ciclo" to a subject:
 * - Marks Estudo Reverso as done
 * - Resets all review stage flags
 * - Schedules Rev 7D for +7 days
 */
export function resetCiclo(subject: Subject): Subject {
  return {
    ...subject,
    fixacao24hFeita: true,
    estudoReversoFeito: true,
    rev7dFeita: false,
    rev30dFeita: false,
    rev60dFeita: false,
    rev90dFeita: false,
    currentStage: 'rev7d',
    lastReviewDate: today(),
    nextReviewDate: addDays(new Date(), 7),
    lastPerformance: 'lte_60',
    performanceLevel: 'lte_60',
  };
}
