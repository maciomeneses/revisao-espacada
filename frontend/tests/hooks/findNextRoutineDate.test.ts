import { describe, it, expect } from 'vitest';
import { findNextRoutineDate } from '../../src/hooks/useSubjects';
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

describe('findNextRoutineDate', () => {
  it('rotina vazia retorna a data original sem modificação', () => {
    const result = findNextRoutineDate('2026-05-20', 'Matemática', []);
    expect(result).toBe('2026-05-20');
  });

  it('slot existe mas área não bate retorna a data original', () => {
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Física' })];
    // 2026-05-20 = quarta — nenhum slot de Matemática combina
    const result = findNextRoutineDate('2026-05-20', 'Matemática', routine);
    expect(result).toBe('2026-05-20');
  });

  it('slot sem área (genérico) casa com qualquer área', () => {
    // dayOfWeek 4 = quinta, sem area
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: undefined })];
    // 2026-05-20 = quarta → próxima quinta é 2026-05-21
    const result = findNextRoutineDate('2026-05-20', 'Matemática', routine);
    expect(result).toBe('2026-05-21');
  });

  it('slot com area string vazia também casa com qualquer área', () => {
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: '' })];
    const result = findNextRoutineDate('2026-05-20', 'Química', routine);
    expect(result).toBe('2026-05-21');
  });

  it('fsrsDate já é dia de estudo daquela área retorna inalterado', () => {
    // 2026-05-21 = quinta, slot Mat na quinta
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    const result = findNextRoutineDate('2026-05-21', 'Matemática', routine);
    expect(result).toBe('2026-05-21');
  });

  it('avança ao próximo dia útil dentro da semana (quarta → quinta)', () => {
    const routine: StudentRoutine = [slot({ dayOfWeek: 4, area: 'Matemática' })];
    // 2026-05-20 = quarta → próxima quinta é 2026-05-21
    const result = findNextRoutineDate('2026-05-20', 'Matemática', routine);
    expect(result).toBe('2026-05-21');
  });

  it('salta para a próxima semana (domingo → segunda da semana seguinte)', () => {
    const routine: StudentRoutine = [slot({ dayOfWeek: 1, area: 'Matemática' })];
    // 2026-05-17 = domingo → próxima segunda é 2026-05-18
    const result = findNextRoutineDate('2026-05-17', 'Matemática', routine);
    expect(result).toBe('2026-05-18');
  });

  it('ignora slots type=other mesmo no dia certo', () => {
    const routine: StudentRoutine = [
      slot({ dayOfWeek: 4, area: 'Matemática', type: 'other' }),
    ];
    // O único slot é "other", então não há dia de estudo válido — retorna fsrsDate
    const result = findNextRoutineDate('2026-05-20', 'Matemática', routine);
    expect(result).toBe('2026-05-20');
  });

  it('não modifica scheduledDays nem mexe nos slots da rotina', () => {
    const original: StudentRoutine = [
      slot({ id: 'a', dayOfWeek: 4, area: 'Matemática' }),
      slot({ id: 'b', dayOfWeek: 2, area: 'Física' }),
    ];
    const snapshot = JSON.parse(JSON.stringify(original));
    findNextRoutineDate('2026-05-20', 'Matemática', original);
    expect(original).toEqual(snapshot);
  });

  it('escolhe o slot de estudo correto quando há múltiplos slots e áreas', () => {
    const routine: StudentRoutine = [
      slot({ dayOfWeek: 1, area: 'Física' }),
      slot({ dayOfWeek: 5, area: 'Matemática' }), // sexta
      slot({ dayOfWeek: 3, area: 'Química' }),
    ];
    // 2026-05-20 = quarta → próxima sexta para Matemática é 2026-05-22
    const result = findNextRoutineDate('2026-05-20', 'Matemática', routine);
    expect(result).toBe('2026-05-22');
  });
});
