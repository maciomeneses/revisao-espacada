export type ActiveView = 'dashboard' | 'cronograma' | 'agenda' | 'espiao';

export interface Subject {
  id: string;
  modulo: string;
  area: string;
  aulaPrincipal: string;
  relevancia: string;
  aulaAssistida: boolean;
  preAulaFeita: boolean;
  flashcardsFeitos: boolean;
  currentStage: string;
  nextReviewDate: string | null;
  lastReviewDate: string | null;
  lastPerformance: string | null;
  performanceLevel: string;
  
  // FSRS fields
  stability?: number;
  difficulty?: number;
  elapsedDays?: number;
  scheduledDays?: number;
  reps?: number;
  lapses?: number;
  state?: string;
}
