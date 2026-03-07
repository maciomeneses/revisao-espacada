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
