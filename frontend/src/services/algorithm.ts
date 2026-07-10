import { Performance, ReviewStage, Subject } from '../types';

// FSRS v6 Default Parameters
export const DEFAULT_W = [
  0.4025,
  0.8935,
  2.1812,
  4.1256, // S0 (G1-G4)
  4.8228,
  0.7428,
  0.9651,
  0.0215, // D0, Difficulty/Stability update
  1.65,
  0.115,
  1.0151,
  2.0,
  0.06,
  0.32,
  1.3,
  0.42,
  2.55,
  0.0,
  0.5,
  0.0,
  0.2,
];

export const REQUEST_RETENTION = 0.9;
export const DECAY = -0.5;
export const FACTOR = Math.pow(0.9, 1.0 / DECAY) - 1;

export function calculateNextReview(subject: Subject, numCorrect: number): Partial<Subject> {
  // Blocagem: Convert number of correct answers (0-10) to Rating (1-4)
  let rating = 3; // Good
  if (numCorrect <= 4)
    rating = 1; // Again
  else if (numCorrect <= 6)
    rating = 2; // Hard
  else if (numCorrect <= 8)
    rating = 3; // Good
  else rating = 4; // Easy

  // Nível de desempenho persistido (ver tabela numCorrect → Rating → Performance
  // em docs/conventions/fsrs.md). O backend espera o NOME do nível — dígitos
  // ('1'..'4') não são reconhecidos por PerformanceLevel.fromValue e degradam
  // silenciosamente para 'nao_classificada'.
  const performance: Performance =
    rating === 1 ? 'ruim' : rating === 2 ? 'medio' : rating === 3 ? 'bom' : 'excelente';

  const { stability = 0, difficulty = 0 } = subject;
  let { reps = 0, lapses = 0 } = subject;
  const now = new Date();

  let nextStability: number;
  let nextDifficulty: number;
  let state: ReviewStage;

  if (reps === 0 || !stability) {
    // First review
    nextStability = DEFAULT_W[rating - 1];
    nextDifficulty = DEFAULT_W[4] - (rating - 1) * DEFAULT_W[5];
    state = 'Learning';
  } else {
    // Subsequent reviews
    const lastReview = subject.lastReviewDate ? parseLocalDate(subject.lastReviewDate) : new Date();
    const elapsedDays = Math.max(
      0,
      Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const retrievability = Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);

    // Update Difficulty
    nextDifficulty = difficulty - DEFAULT_W[17] * (rating - 3);
    nextDifficulty = Math.max(1, Math.min(10, nextDifficulty));

    // Update Stability
    if (rating === 1) {
      nextStability =
        DEFAULT_W[11] *
        Math.pow(nextDifficulty, -DEFAULT_W[12]) *
        (Math.pow(stability + 1, DEFAULT_W[13]) - 1) *
        Math.exp(DEFAULT_W[14] * (1 - retrievability));
      lapses++;
      state = 'Relearning';
    } else {
      const hardPenalty = rating === 2 ? DEFAULT_W[15] : 1.0;
      const easyBonus = rating === 4 ? DEFAULT_W[16] : 1.0;

      const stabilityUpdate =
        1 +
        Math.exp(DEFAULT_W[8]) *
          (11 - nextDifficulty) *
          Math.pow(stability, -DEFAULT_W[9]) *
          (Math.exp((1 - retrievability) * DEFAULT_W[10]) - 1) *
          hardPenalty *
          easyBonus;

      // Ensure stability actually increases for Good/Easy if retrievability is high or normal
      nextStability = stability * Math.max(1.25, stabilityUpdate);
      state = 'Review';
    }
  }

  reps++;
  const scheduledDays = Math.max(1, Math.round(nextStability));
  const nextReviewDate = new Date();
  nextReviewDate.setDate(now.getDate() + scheduledDays);

  return {
    stability: nextStability,
    difficulty: nextDifficulty,
    reps,
    lapses,
    state,
    scheduledDays,
    // Data local (YYYY-MM-DD): o backend persiste como LocalDate; enviar ISO
    // datetime UTC deslocava a data em +1 dia para revisões feitas à noite.
    lastReviewDate: localDateStr(now),
    nextReviewDate: localDateStr(nextReviewDate),
    lastPerformance: performance,
    performanceLevel: performance,
    currentStage: state,
  };
}

export function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Interpreta uma data serializada no fuso LOCAL. Strings date-only
 * (`YYYY-MM-DD`, como o backend devolve para LocalDate) são ancoradas ao
 * meio-dia local — `new Date('YYYY-MM-DD')` interpretaria como meia-noite
 * UTC e recuaria um dia em fusos negativos. Strings com horário (ISO legado)
 * são parseadas normalmente.
 */
export function parseLocalDate(iso: string): Date {
  return new Date(iso.length > 10 ? iso : iso + 'T12:00:00');
}

export function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return localDateStr(result);
}

export function today(): string {
  return localDateStr(new Date());
}

export function getProximaTarefa(stage: string): string {
  switch (stage) {
    case 'aula':
      return 'Aula';
    case 'Learning':
      return 'Aprendizado';
    case 'Review':
      return 'Revisão';
    case 'Relearning':
      return 'Reaprendizado';
    case 'New':
      return 'Novo';
    // Legacy mapping for tests compatibility if needed, but FSRS uses the above
    case 'fixacao':
      return 'Fixação 24H';
    case 'estudo_reverso':
      return 'Estudo Reverso';
    case 'rev7d':
      return 'Revisão 7 Dias';
    case 'rev30d':
      return 'Revisão 30 Dias';
    case 'rev60d':
      return 'Revisão 60 Dias';
    case 'rev90d':
      return 'Revisão 90 Dias';
    case 'concluido':
      return 'Concluído';
    default:
      return stage;
  }
}

export function getFormulaStatus(subject: Subject): string {
  if (subject.currentStage === 'aula') return '';
  if (subject.currentStage === 'concluido') return 'Concluído';
  if (!subject.nextReviewDate) return '';

  const todayStr = today();
  if (subject.nextReviewDate < todayStr) return 'Atrasado';
  if (subject.nextReviewDate === todayStr) return 'Hoje';
  return 'No Prazo';
}

export function resetCiclo(subject: Subject): Subject {
  return {
    ...subject,
    reps: 0,
    lapses: 0,
    stability: 0,
    difficulty: 0,
    state: 'New',
    currentStage: 'aula',
    nextReviewDate: null,
    lastReviewDate: null,
    lastPerformance: null,
    performanceLevel: 'nao_classificada',
    aulaAssistida: false,
    flashcardsFeitos: false,
  };
}
