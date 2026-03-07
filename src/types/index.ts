export type Area = string;

export type Relevance = 'Alta' | 'Média' | 'Baixa';

export type Performance = 'gte_80' | 'range_61_79' | 'lte_60';

export type PerformanceLevel = 'nao_classificada' | 'gte_80' | 'range_61_79' | 'lte_60';

export type ReviewStage =
  | 'aula'           // Needs to attend class
  | 'fixacao'        // 24h fixation (day after class)
  | 'estudo_reverso' // Failed fixação, do reverse study
  | 'rev7d'          // 7-day review
  | 'rev30d'         // 30-day review
  | 'rev60d'         // 60-day review
  | 'rev90d'         // 90-day review
  | 'concluido';     // All done

export interface Subject {
  id: string;
  modulo: string;         // e.g. "FÍSICA 001"
  area: Area;
  aulaPrincipal: string;  // e.g. "Leis de Newton"
  relevancia: Relevance;

  // Progress flags
  aulaAssistida: boolean;
  preAulaFeita: boolean;
  flashcardsFeitos: boolean;

  // Review stage completions
  // Note: fixacao/estudoReverso are marked done when performed.
  // Rev stages are marked done only when PASSED (≥61%).
  fixacao24hFeita: boolean;
  estudoReversoFeito: boolean;
  rev7dFeita: boolean;
  rev30dFeita: boolean;
  rev60dFeita: boolean;
  rev90dFeita: boolean;

  // Current scheduling state
  currentStage: ReviewStage;
  nextReviewDate: string | null; // ISO date string
  lastReviewDate: string | null; // ISO date string
  lastPerformance: Performance | null;

  // For Espião Estratégico board grouping
  performanceLevel: PerformanceLevel;
}

export type ActiveView = 'dashboard' | 'cronograma' | 'agenda' | 'espiao';
