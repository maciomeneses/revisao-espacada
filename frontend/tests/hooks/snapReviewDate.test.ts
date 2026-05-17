import { describe, it, expect } from 'vitest';
import { snapReviewDate } from '../../src/hooks/useSubjects';
import type { StudentRoutine, RoutineSlot } from '../../src/types';

function slot(overrides: Partial<RoutineSlot> = {}): RoutineSlot {
  return {
    id: 's-' + Math.random().toString(36).slice(2),
    dayOfWeek: 1,
    title: 'Estudo',
    type: 'study',
    area: 'Matemática',
    ...overrides,
  };
}

describe('snapReviewDate', () => {
  it('allowedDays undefined preserva comportamento legado (rotina vazia → data original)', () => {
    const result = snapReviewDate('2026-05-20', 'Matemática', [], undefined);
    expect(result).toBe('2026-05-20');
  });

  it('allowedDays undefined + rotina aplicável avança como antes', () => {
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    // 2026-05-20 = quarta → próxima quinta = 2026-05-21
    const result = snapReviewDate('2026-05-20', 'Matemática', routine, undefined);
    expect(result).toBe('2026-05-21');
  });

  it('allowedDays cobrindo todos os dias é equivalente a undefined', () => {
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    const all = new Set([0, 1, 2, 3, 4, 5, 6]);
    const result = snapReviewDate('2026-05-20', 'Matemática', routine, all);
    expect(result).toBe('2026-05-21');
  });

  it('allowedDays vazio (Set vazio) trata como "todos os dias"', () => {
    // 2026-05-20 = quarta; rotina vazia ⇒ retorna a própria data
    const result = snapReviewDate('2026-05-20', 'Matemática', [], new Set());
    expect(result).toBe('2026-05-20');
  });

  it('allowedDays = seg-sex, fsrsDate=sábado, rotina vazia → empurra para segunda', () => {
    // 2026-05-16 = sábado
    const segASex = new Set([1, 2, 3, 4, 5]);
    const result = snapReviewDate('2026-05-16', 'Matemática', [], segASex);
    // próxima seg = 2026-05-18
    expect(result).toBe('2026-05-18');
  });

  it('allowedDays = só segunda, rotina só na quinta → fallback: primeira segunda', () => {
    // 2026-05-20 = quarta; allowed apenas segunda(1); rotina quinta(4)
    // Interseção vazia ⇒ fallback para primeira segunda dentro de 21 dias = 2026-05-25
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    const soSeg = new Set([1]);
    const result = snapReviewDate('2026-05-20', 'Matemática', routine, soSeg);
    expect(result).toBe('2026-05-25');
  });

  it('allowedDays = seg/qua/sex e rotina inclui quarta → escolhe quarta (interseção)', () => {
    // 2026-05-19 = terça; rotina inclui quarta(3) e quinta(4); allowed = seg(1)/qua(3)/sex(5)
    // Interseção entre rotina e allowed = quarta(3); próxima quarta = 2026-05-20
    const routine: StudentRoutine = [
      slot({ dayOfWeek: 3, area: 'Matemática' }),
      slot({ dayOfWeek: 4, area: 'Matemática' }),
    ];
    const segQuaSex = new Set([1, 3, 5]);
    const result = snapReviewDate('2026-05-19', 'Matemática', routine, segQuaSex);
    expect(result).toBe('2026-05-20');
  });

  it('allowedDays sem interseção com rotina mas com dia válido = retorna primeiro allowed', () => {
    // fsrsDate quarta 2026-05-20; rotina apenas quinta(4); allowed apenas sexta(5)
    // Interseção vazia ⇒ fallback: primeira sexta = 2026-05-22
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    const soSex = new Set([5]);
    const result = snapReviewDate('2026-05-20', 'Matemática', routine, soSex);
    expect(result).toBe('2026-05-22');
  });

  it('fsrsDate já satisfaz ambas as restrições retorna inalterado', () => {
    // 2026-05-21 = quinta; rotina quinta; allowed inclui quinta
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    const result = snapReviewDate('2026-05-21', 'Matemática', routine, new Set([4]));
    expect(result).toBe('2026-05-21');
  });

  it('slot genérico (area vazia) combina com qualquer área respeitando allowedDays', () => {
    // 2026-05-20 = quarta; rotina genérica quinta; allowed seg-sex
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: '' })];
    const segASex = new Set([1, 2, 3, 4, 5]);
    const result = snapReviewDate('2026-05-20', 'Química', routine, segASex);
    expect(result).toBe('2026-05-21');
  });
});
