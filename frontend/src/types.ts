export type ActiveView = 'dashboard' | 'cronograma' | 'espiao' | 'provas' | 'categorias' | 'admin';

export type Role = 'USER' | 'ADMIN';

export interface ExamEntry {
  id: number;
  examDate: string; // YYYY-MM-DD
  examName: string;
  examType?: string;
  scorePercent: number;
  notes?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  password?: string;
}

/** Entidade Area (catálogo por usuário, V10). */
export interface Area {
  id: number;
  name: string;
}

/** Entidade Discipline dentro de uma Area. */
export interface Discipline {
  id: number;
  areaId: number;
  areaName?: string;
  name: string;
}

/** Nome de área como string — usado em Subject.area (campo legado preservado por compat). */
export type AreaName = string;
export type Relevance = 'Alta' | 'Média' | 'Baixa';
export type Performance = 'ruim' | 'medio' | 'bom' | 'excelente';
export type PerformanceLevel = 'nao_classificada' | 'ruim' | 'medio' | 'bom' | 'excelente';

/**
 * Estágios FSRS atuais + estágios legados ainda presentes em dados antigos
 * (localStorage/backend) e tratados por `getProximaTarefa`/`getFormulaStatus`.
 */
export type ReviewStage =
  | 'aula'
  | 'Learning'
  | 'Review'
  | 'Relearning'
  | 'New'
  | 'fixacao'
  | 'estudo_reverso'
  | 'rev7d'
  | 'rev30d'
  | 'rev60d'
  | 'rev90d'
  | 'concluido';

export interface Subject {
  id: string;
  modulo: string;
  area: AreaName;
  aulaPrincipal: string;
  relevancia: Relevance;

  // Progress flags
  aulaAssistida: boolean;
  preAulaFeita: boolean;
  flashcardsFeitos: boolean;

  // FSRS v6 state
  stability?: number;
  difficulty?: number;
  elapsedDays?: number;
  scheduledDays?: number;
  reps?: number;
  lapses?: number;
  state?: string;

  // Compatibility/Legacy fields
  currentStage: ReviewStage;
  nextReviewDate: string | null;
  lastReviewDate: string | null;
  lastPerformance: Performance | null;
  performanceLevel: PerformanceLevel;

  // Legacy stage flags (keeping as optional for compatibility with components I haven't fixed yet)
  fixacao24hFeita?: boolean;
  estudoReversoFeito?: boolean;
  rev7dFeita?: boolean;
  rev30dFeita?: boolean;
  rev60dFeita?: boolean;
  rev90dFeita?: boolean;
}

export interface RoutineSlot {
  id: string;
  dayOfWeek: number; // 0=Dom, 1=Seg, ..., 6=Sáb
  title: string;
  startTime?: string; // "HH:MM"
  endTime?: string; // "HH:MM"
  type: 'study' | 'other';
  area?: string; // só quando type === 'study'; casa com Subject.area
}

export type StudentRoutine = RoutineSlot[];
