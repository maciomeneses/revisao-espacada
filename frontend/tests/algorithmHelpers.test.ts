import { describe, it, expect } from 'vitest';
import {
  getProximaTarefa,
  getFormulaStatus,
  today,
  addDays,
} from '../src/services/algorithm';
import type { Subject } from '../src/types';

const makeSubject = (overrides: Partial<Subject>): Subject => ({
  id: 'test-1',
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
  ...overrides,
});

describe('getProximaTarefa', () => {
  it.each([
    ['aula', 'Aula'],
    ['Learning', 'Aprendizado'],
    ['Review', 'Revisão'],
    ['Relearning', 'Reaprendizado'],
    ['New', 'Novo'],
    ['concluido', 'Concluído'],
    ['fixacao', 'Fixação 24H'],
    ['estudo_reverso', 'Estudo Reverso'],
    ['rev7d', 'Revisão 7 Dias'],
    ['rev30d', 'Revisão 30 Dias'],
    ['rev60d', 'Revisão 60 Dias'],
    ['rev90d', 'Revisão 90 Dias'],
  ])('stage "%s" deve retornar "%s"', (stage, expected) => {
    expect(getProximaTarefa(stage)).toBe(expected);
  });

  it('deve retornar o próprio stage para valores desconhecidos', () => {
    expect(getProximaTarefa('stage_desconhecido')).toBe('stage_desconhecido');
  });
});

describe('getFormulaStatus', () => {
  const _now = new Date();
  const todayStr = today();
  const yesterday = addDays(new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() - 1), 0);
  const tomorrow = addDays(new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 1), 0);

  it('retorna string vazia para stage "aula"', () => {
    const s = makeSubject({ currentStage: 'aula' });
    expect(getFormulaStatus(s)).toBe('');
  });

  it('retorna "Concluído" para stage "concluido"', () => {
    const s = makeSubject({ currentStage: 'concluido' });
    expect(getFormulaStatus(s)).toBe('Concluído');
  });

  it('retorna string vazia para subject sem nextReviewDate', () => {
    const s = makeSubject({ currentStage: 'Learning', nextReviewDate: null });
    expect(getFormulaStatus(s)).toBe('');
  });

  it('retorna "Atrasado" quando nextReviewDate é ontem', () => {
    const s = makeSubject({ currentStage: 'Review', nextReviewDate: yesterday });
    expect(getFormulaStatus(s)).toBe('Atrasado');
  });

  it('retorna "Hoje" quando nextReviewDate é hoje', () => {
    const s = makeSubject({ currentStage: 'Review', nextReviewDate: todayStr });
    expect(getFormulaStatus(s)).toBe('Hoje');
  });

  it('retorna "No Prazo" quando nextReviewDate é amanhã', () => {
    const s = makeSubject({ currentStage: 'Review', nextReviewDate: tomorrow });
    expect(getFormulaStatus(s)).toBe('No Prazo');
  });
});

describe('today', () => {
  it('retorna data no formato YYYY-MM-DD', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('addDays', () => {
  it('adiciona dias corretamente', () => {
    expect(addDays(new Date(2026, 2, 16), 7)).toBe('2026-03-23');
  });

  it('lida com overflow de mês', () => {
    expect(addDays(new Date(2026, 0, 28), 7)).toBe('2026-02-04');
  });

  it('adicionar 0 dias retorna a mesma data', () => {
    expect(addDays(new Date(2026, 2, 16), 0)).toBe('2026-03-16');
  });

  it('dias negativos voltam no tempo', () => {
    expect(addDays(new Date(2026, 2, 16), -7)).toBe('2026-03-09');
  });
});
