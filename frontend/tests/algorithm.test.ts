import { describe, it, expect } from 'vitest';
import { computeStageTransition, addDays } from '../src/services/algorithm';

describe('addDays', () => {
  it('adds days correctly', () => {
    const result = addDays(new Date('2026-01-01'), 7);
    expect(result).toBe('2026-01-08');
  });

  it('handles month overflow', () => {
    const result = addDays(new Date('2026-01-28'), 7);
    expect(result).toBe('2026-02-04');
  });
});

describe('computeStageTransition — Fixação (aula → fixação)', () => {
  it('aula always leads to fixação next day', () => {
    const t = computeStageTransition('aula', 'Alta', 'gte_80');
    expect(t.nextStage).toBe('fixacao');
    expect(t.daysUntilNext).toBe(1);
    expect(t.stageCompleted).toBe(true);
  });
});

describe('computeStageTransition — Fixação 24H', () => {
  it('≤60% leads to Estudo Reverso', () => {
    const t = computeStageTransition('fixacao', 'Alta', 'lte_60');
    expect(t.nextStage).toBe('estudo_reverso');
    expect(t.daysUntilNext).toBe(1);
    expect(t.stageCompleted).toBe(true);
  });

  it('61-79% leads to Rev 7D', () => {
    const t = computeStageTransition('fixacao', 'Alta', 'range_61_79');
    expect(t.nextStage).toBe('rev7d');
    expect(t.daysUntilNext).toBe(7);
    expect(t.stageCompleted).toBe(true);
  });

  it('≥80% leads to Rev 7D', () => {
    const t = computeStageTransition('fixacao', 'Alta', 'gte_80');
    expect(t.nextStage).toBe('rev7d');
    expect(t.daysUntilNext).toBe(7);
    expect(t.stageCompleted).toBe(true);
  });
});

describe('computeStageTransition — Estudo Reverso', () => {
  it('always leads to Rev 7D +7 days', () => {
    const t = computeStageTransition('estudo_reverso', 'Alta', 'gte_80');
    expect(t.nextStage).toBe('rev7d');
    expect(t.daysUntilNext).toBe(7);
    expect(t.stageCompleted).toBe(true);
  });
});

describe('computeStageTransition — Rev 7D with Alta relevância', () => {
  it('≤60% → Resgate (retry in 7d, not completed)', () => {
    const t = computeStageTransition('rev7d', 'Alta', 'lte_60');
    expect(t.nextStage).toBe('rev7d');
    expect(t.daysUntilNext).toBe(7);
    expect(t.stageCompleted).toBe(false);
  });

  it('61-79% → Rev 30D (+30d)', () => {
    const t = computeStageTransition('rev7d', 'Alta', 'range_61_79');
    expect(t.nextStage).toBe('rev30d');
    expect(t.daysUntilNext).toBe(30);
    expect(t.stageCompleted).toBe(true);
  });

  it('≥80% → SKIP to Rev 60D (+60d)', () => {
    const t = computeStageTransition('rev7d', 'Alta', 'gte_80');
    expect(t.nextStage).toBe('rev60d');
    expect(t.daysUntilNext).toBe(60);
    expect(t.stageCompleted).toBe(true);
  });
});

describe('computeStageTransition — Rev 7D with Média relevância', () => {
  it('≤60% → Resgate in 14d', () => {
    const t = computeStageTransition('rev7d', 'Média', 'lte_60');
    expect(t.nextStage).toBe('rev7d');
    expect(t.daysUntilNext).toBe(14);
    expect(t.stageCompleted).toBe(false);
  });

  it('61-79% → Rev 30D', () => {
    const t = computeStageTransition('rev7d', 'Média', 'range_61_79');
    expect(t.nextStage).toBe('rev30d');
    expect(t.stageCompleted).toBe(true);
  });

  it('≥80% → Concluído', () => {
    const t = computeStageTransition('rev7d', 'Média', 'gte_80');
    expect(t.nextStage).toBe('concluido');
    expect(t.stageCompleted).toBe(true);
  });
});

describe('computeStageTransition — Rev 7D with Baixa relevância', () => {
  it('≤60% → Resgate in 30d (postpone, do not interrupt this week)', () => {
    const t = computeStageTransition('rev7d', 'Baixa', 'lte_60');
    expect(t.nextStage).toBe('rev7d');
    expect(t.daysUntilNext).toBe(30);
    expect(t.stageCompleted).toBe(false);
  });

  it('61-79% → Concluído', () => {
    const t = computeStageTransition('rev7d', 'Baixa', 'range_61_79');
    expect(t.nextStage).toBe('concluido');
    expect(t.stageCompleted).toBe(true);
  });

  it('≥80% → Concluído', () => {
    const t = computeStageTransition('rev7d', 'Baixa', 'gte_80');
    expect(t.nextStage).toBe('concluido');
    expect(t.stageCompleted).toBe(true);
  });
});

describe('computeStageTransition — Rev 30D with Alta relevância', () => {
  it('≤60% → Resgate in 7d', () => {
    const t = computeStageTransition('rev30d', 'Alta', 'lte_60');
    expect(t.nextStage).toBe('rev30d');
    expect(t.daysUntilNext).toBe(7);
    expect(t.stageCompleted).toBe(false);
  });

  it('61-79% → Rev 60D (+60d)', () => {
    const t = computeStageTransition('rev30d', 'Alta', 'range_61_79');
    expect(t.nextStage).toBe('rev60d');
    expect(t.daysUntilNext).toBe(60);
    expect(t.stageCompleted).toBe(true);
  });

  it('≥80% → SKIP to Rev 90D (+90d)', () => {
    const t = computeStageTransition('rev30d', 'Alta', 'gte_80');
    expect(t.nextStage).toBe('rev90d');
    expect(t.daysUntilNext).toBe(90);
    expect(t.stageCompleted).toBe(true);
  });
});

describe('computeStageTransition — Rev 30D with Média relevância', () => {
  it('≤60% → Resgate in 14d', () => {
    const t = computeStageTransition('rev30d', 'Média', 'lte_60');
    expect(t.nextStage).toBe('rev30d');
    expect(t.daysUntilNext).toBe(14);
    expect(t.stageCompleted).toBe(false);
  });

  it('61-79% → Concluído', () => {
    const t = computeStageTransition('rev30d', 'Média', 'range_61_79');
    expect(t.nextStage).toBe('concluido');
    expect(t.stageCompleted).toBe(true);
  });

  it('≥80% → Concluído', () => {
    const t = computeStageTransition('rev30d', 'Média', 'gte_80');
    expect(t.nextStage).toBe('concluido');
    expect(t.stageCompleted).toBe(true);
  });
});

describe('computeStageTransition — Rev 60D (Alta only)', () => {
  it('≤60% → Resgate in 7d', () => {
    const t = computeStageTransition('rev60d', 'Alta', 'lte_60');
    expect(t.nextStage).toBe('rev60d');
    expect(t.daysUntilNext).toBe(7);
    expect(t.stageCompleted).toBe(false);
  });

  it('61-79% → Rev 90D (+90d)', () => {
    const t = computeStageTransition('rev60d', 'Alta', 'range_61_79');
    expect(t.nextStage).toBe('rev90d');
    expect(t.daysUntilNext).toBe(90);
    expect(t.stageCompleted).toBe(true);
  });

  it('≥80% → Concluído', () => {
    const t = computeStageTransition('rev60d', 'Alta', 'gte_80');
    expect(t.nextStage).toBe('concluido');
    expect(t.stageCompleted).toBe(true);
  });
});

describe('computeStageTransition — Rev 90D (Alta only)', () => {
  it('≤60% → Resgate in 7d', () => {
    const t = computeStageTransition('rev90d', 'Alta', 'lte_60');
    expect(t.nextStage).toBe('rev90d');
    expect(t.daysUntilNext).toBe(7);
    expect(t.stageCompleted).toBe(false);
  });

  it('61-79% → Concluído', () => {
    const t = computeStageTransition('rev90d', 'Alta', 'range_61_79');
    expect(t.nextStage).toBe('concluido');
    expect(t.stageCompleted).toBe(true);
  });

  it('≥80% → Concluído', () => {
    const t = computeStageTransition('rev90d', 'Alta', 'gte_80');
    expect(t.nextStage).toBe('concluido');
    expect(t.stageCompleted).toBe(true);
  });
});

describe('computeStageTransition — Concluído', () => {
  it('concluido always stays concluido', () => {
    const t = computeStageTransition('concluido', 'Alta', 'gte_80');
    expect(t.nextStage).toBe('concluido');
    expect(t.daysUntilNext).toBe(0);
    expect(t.stageCompleted).toBe(true);
  });
});

import { today, getProximaTarefa, getFormulaStatus, resetCiclo } from '../src/services/algorithm';
import type { Subject } from '../src/types';

describe('today', () => {
  it('returns today date in YYYY-MM-DD format', () => {
    const t = today();
    expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getProximaTarefa', () => {
  it('returns correct label for each stage', () => {
    expect(getProximaTarefa('aula')).toBe('Aula');
    expect(getProximaTarefa('fixacao')).toBe('Fixação 24H');
    expect(getProximaTarefa('estudo_reverso')).toBe('Estudo Reverso');
    expect(getProximaTarefa('rev7d')).toBe('Revisão 7 Dias');
    expect(getProximaTarefa('rev30d')).toBe('Revisão 30 Dias');
    expect(getProximaTarefa('rev60d')).toBe('Revisão 60 Dias');
    expect(getProximaTarefa('rev90d')).toBe('Revisão 90 Dias');
    expect(getProximaTarefa('concluido')).toBe('Concluído');
  });
});

describe('getFormulaStatus', () => {
  it('returns empty string if stage is aula', () => {
    const subject = { currentStage: 'aula' } as Subject;
    expect(getFormulaStatus(subject)).toBe('');
  });

  it('returns Concluído if stage is concluido', () => {
    const subject = { currentStage: 'concluido' } as Subject;
    expect(getFormulaStatus(subject)).toBe('Concluído');
  });

  it('returns empty string if nextReviewDate is missing', () => {
    const subject = { currentStage: 'rev7d', nextReviewDate: null } as Subject;
    expect(getFormulaStatus(subject)).toBe('');
  });

  it('returns Atrasado if nextReviewDate is before today', () => {
    const subject = { currentStage: 'rev7d', nextReviewDate: '2000-01-01' } as Subject;
    expect(getFormulaStatus(subject)).toBe('Atrasado');
  });

  it('returns Hoje if nextReviewDate is today', () => {
    const subject = { currentStage: 'rev7d', nextReviewDate: today() } as Subject;
    expect(getFormulaStatus(subject)).toBe('Hoje');
  });

  it('returns No Prazo if nextReviewDate is after today', () => {
    const subject = { currentStage: 'rev7d', nextReviewDate: '2099-01-01' } as Subject;
    expect(getFormulaStatus(subject)).toBe('No Prazo');
  });
});

describe('resetCiclo', () => {
  it('resets subject state and schedules rev7d', () => {
    const mockSubject: Subject = {
      id: '1',
      modulo: 'M1',
      area: 'A1',
      aulaPrincipal: 'Aula 1',
      relevancia: 'Alta',
      aulaAssistida: true,
      preAulaFeita: true,
      flashcardsFeitos: true,
      fixacao24hFeita: false,
      estudoReversoFeito: false,
      rev7dFeita: true,
      rev30dFeita: true,
      rev60dFeita: true,
      rev90dFeita: true,
      currentStage: 'rev90d',
      nextReviewDate: '2020-01-01',
      lastReviewDate: '2020-01-01',
      lastPerformance: 'gte_80',
      performanceLevel: 'gte_80',
    };

    const resetSubject = resetCiclo(mockSubject);

    expect(resetSubject.fixacao24hFeita).toBe(true);
    expect(resetSubject.estudoReversoFeito).toBe(true);
    expect(resetSubject.rev7dFeita).toBe(false);
    expect(resetSubject.rev30dFeita).toBe(false);
    expect(resetSubject.rev60dFeita).toBe(false);
    expect(resetSubject.rev90dFeita).toBe(false);
    expect(resetSubject.currentStage).toBe('rev7d');
    expect(resetSubject.lastReviewDate).toBe(today());
    expect(resetSubject.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(resetSubject.lastPerformance).toBe('lte_60');
    expect(resetSubject.performanceLevel).toBe('lte_60');
  });
});
