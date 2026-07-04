import { describe, it, expect } from 'vitest';
import { buildDayLoad, snapReviewDate } from '../../src/hooks/useSubjects';
import type { StudentRoutine, RoutineSlot, Subject } from '../../src/types';

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

describe('snapReviewDate — limite diário (capacidade)', () => {
  const allDays = new Set([0, 1, 2, 3, 4, 5, 6]);

  it('sem limite (opts ausente) preserva comportamento atual mesmo com dia carregado', () => {
    const result = snapReviewDate('2026-05-20', 'Matemática', [], allDays);
    expect(result).toBe('2026-05-20');
  });

  it('maxPerDay null preserva comportamento atual', () => {
    const dayLoad = new Map([['2026-05-20', 99]]);
    const result = snapReviewDate('2026-05-20', 'Matemática', [], allDays, {
      maxPerDay: null,
      dayLoad,
    });
    expect(result).toBe('2026-05-20');
  });

  it('dia cheio empurra para o próximo dia permitido com vaga', () => {
    // 2026-05-20 = quarta, lotada (3/3) → quinta 2026-05-21
    const dayLoad = new Map([['2026-05-20', 3]]);
    const result = snapReviewDate('2026-05-20', 'Matemática', [], allDays, {
      maxPerDay: 3,
      dayLoad,
    });
    expect(result).toBe('2026-05-21');
  });

  it('dia com vaga (abaixo do teto) mantém a data FSRS', () => {
    const dayLoad = new Map([['2026-05-20', 2]]);
    const result = snapReviewDate('2026-05-20', 'Matemática', [], allDays, {
      maxPerDay: 3,
      dayLoad,
    });
    expect(result).toBe('2026-05-20');
  });

  it('nunca viola allowedDays ao desviar de dia cheio', () => {
    // 2026-05-22 = sexta, cheia; sábado/domingo não permitidos → segunda 2026-05-25
    const segASex = new Set([1, 2, 3, 4, 5]);
    const dayLoad = new Map([['2026-05-22', 2]]);
    const result = snapReviewDate('2026-05-22', 'Matemática', [], segASex, {
      maxPerDay: 2,
      dayLoad,
    });
    expect(result).toBe('2026-05-25');
  });

  it('limite 1: pula dias ocupados em sequência até o primeiro livre', () => {
    const dayLoad = new Map([
      ['2026-05-20', 1],
      ['2026-05-21', 1],
      ['2026-05-22', 1],
    ]);
    const result = snapReviewDate('2026-05-20', 'Matemática', [], allDays, {
      maxPerDay: 1,
      dayLoad,
    });
    expect(result).toBe('2026-05-23');
  });

  it('respeita a rotina: procura o próximo dia de estudo com vaga', () => {
    // rotina só quarta(3); quarta 2026-05-20 cheia → próxima quarta 2026-05-27
    const routine: StudentRoutine = [slot({ dayOfWeek: 3, area: 'Matemática' })];
    const dayLoad = new Map([['2026-05-20', 2]]);
    const result = snapReviewDate('2026-05-20', 'Matemática', routine, allDays, {
      maxPerDay: 2,
      dayLoad,
    });
    expect(result).toBe('2026-05-27');
  });

  it('horizonte inteiro cheio: escolhe o dia permitido menos carregado', () => {
    // Todos os 22 dias com carga 2 (teto 1), exceto 2026-05-25 com carga 1.
    const dayLoad = new Map<string, number>();
    for (let i = 0; i <= 21; i++) {
      const d = new Date('2026-05-20T12:00:00');
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      dayLoad.set(iso, iso === '2026-05-25' ? 1 : 2);
    }
    const result = snapReviewDate('2026-05-20', 'Matemática', [], allDays, {
      maxPerDay: 1,
      dayLoad,
    });
    expect(result).toBe('2026-05-25');
  });

  it('horizonte cheio com empate: escolhe o dia mais cedo (nunca deixa sem data)', () => {
    const dayLoad = new Map<string, number>();
    for (let i = 0; i <= 21; i++) {
      const d = new Date('2026-05-20T12:00:00');
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      dayLoad.set(iso, 5);
    }
    const result = snapReviewDate('2026-05-20', 'Matemática', [], allDays, {
      maxPerDay: 1,
      dayLoad,
    });
    expect(result).toBe('2026-05-20');
  });

  it('horizonte cheio respeita allowedDays no desempate', () => {
    // allowed só segunda(1); todas as segundas cheias → ainda assim retorna uma segunda
    const soSeg = new Set([1]);
    const dayLoad = new Map<string, number>([
      ['2026-05-25', 3],
      ['2026-06-01', 2],
      ['2026-06-08', 4],
    ]);
    const result = snapReviewDate('2026-05-20', 'Matemática', [], soSeg, {
      maxPerDay: 1,
      dayLoad,
    });
    expect(result).toBe('2026-06-01');
  });
});

describe('buildDayLoad', () => {
  function subj(id: string, nextReviewDate: string | null): Subject {
    return { id, nextReviewDate } as unknown as Subject;
  }

  it('conta subjects por data e ignora datas nulas', () => {
    const load = buildDayLoad([
      subj('a', '2026-05-20'),
      subj('b', '2026-05-20'),
      subj('c', '2026-05-21'),
      subj('d', null),
    ]);
    expect(load.get('2026-05-20')).toBe(2);
    expect(load.get('2026-05-21')).toBe(1);
    expect(load.size).toBe(2);
  });

  it('exclui o subject informado em excludeId', () => {
    const load = buildDayLoad([subj('a', '2026-05-20'), subj('b', '2026-05-20')], 'a');
    expect(load.get('2026-05-20')).toBe(1);
  });
});
