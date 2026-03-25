import type { Subject } from '../types';

function makeSubject(
  id: string,
  modulo: string,
  area: Subject['area'],
  aulaPrincipal: string,
  relevancia: Subject['relevancia'],
): Subject {
  return {
    id,
    modulo,
    area,
    aulaPrincipal,
    relevancia,
    aulaAssistida: false,
    preAulaFeita: false,
    flashcardsFeitos: false,
    currentStage: 'aula',
    nextReviewDate: null,
    lastReviewDate: null,
    lastPerformance: null,
    performanceLevel: 'nao_classificada',
  };
}

export const INITIAL_SUBJECTS: Subject[] = [
  makeSubject('fis001', 'FÍSICA 001', 'FÍSICA', 'Leis de Newton', 'Alta'),
  makeSubject('mat001', 'MATEMÁTICA 001', 'MATEMÁTICA', 'Funções de Primeiro Grau', 'Alta'),
  makeSubject('por001', 'PORTUGUÊS 001', 'PORTUGUÊS', 'Interpretação de Texto', 'Alta'),
];
