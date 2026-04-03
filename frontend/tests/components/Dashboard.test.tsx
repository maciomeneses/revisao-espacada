import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from '../../src/components/Dashboard';
import { localDateStr } from '../../src/services/algorithm';
import type { Subject } from '../../src/types';

const _now = new Date();
const today = localDateStr(_now);
const yesterday = localDateStr(new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() - 1));
const tomorrow = localDateStr(new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 1));

function makeSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: 'sub-1',
    modulo: 'Módulo 1',
    area: 'Matemática',
    aulaPrincipal: 'Álgebra',
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
  };
}

/** Gets the stat value by finding the sibling <p> of the label <p> */
function getStatValue(label: string): string {
  const labelEl = screen.getByText(label);
  // The value <p> is a sibling in the same parent div
  const valueEl = labelEl.nextElementSibling;
  return valueEl?.textContent ?? '';
}

describe('Dashboard', () => {
  it('renderiza cards de estatísticas com rótulos corretos', () => {
    render(<Dashboard subjects={[]} onNavigateCronograma={vi.fn()} />);
    expect(screen.getByText('Total de Matérias')).toBeInTheDocument();
    expect(screen.getByText('Revisões para Hoje')).toBeInTheDocument();
    expect(screen.getByText('Conhecimento Estável')).toBeInTheDocument();
  });

  it('exibe total de matérias correto', () => {
    const subjects = [makeSubject({ id: '1' }), makeSubject({ id: '2' })];
    render(<Dashboard subjects={subjects} onNavigateCronograma={vi.fn()} />);
    expect(getStatValue('Total de Matérias')).toBe('2');
  });

  it('conta corretamente revisões pendentes — só até hoje, não futuras', () => {
    const subjects = [
      makeSubject({ id: '1', nextReviewDate: tomorrow }),
      makeSubject({ id: '2', nextReviewDate: today }),
      makeSubject({ id: '3', nextReviewDate: yesterday }),
    ];
    render(<Dashboard subjects={subjects} onNavigateCronograma={vi.fn()} />);
    // today + yesterday = 2; tomorrow should NOT be counted
    expect(getStatValue('Revisões para Hoje')).toBe('2');
  });

  it('conta Conhecimento Estável corretamente (stability > 30)', () => {
    const subjects = [
      makeSubject({ id: '1', stability: 31 }),
      makeSubject({ id: '2', stability: 30 }),
      makeSubject({ id: '3', stability: 29 }),
      makeSubject({ id: '4', stability: undefined }),
    ];
    render(<Dashboard subjects={subjects} onNavigateCronograma={vi.fn()} />);
    // Only id='1' has stability > 30
    expect(getStatValue('Conhecimento Estável')).toBe('1');
  });

  it('todos os contadores são 0 com lista vazia', () => {
    render(<Dashboard subjects={[]} onNavigateCronograma={vi.fn()} />);
    expect(getStatValue('Total de Matérias')).toBe('0');
    expect(getStatValue('Revisões para Hoje')).toBe('0');
    expect(getStatValue('Conhecimento Estável')).toBe('0');
  });

  it('chama onNavigateCronograma ao clicar no botão', () => {
    const mockNavigate = vi.fn();
    render(<Dashboard subjects={[]} onNavigateCronograma={mockNavigate} />);

    const btn = screen.getByRole('button', { name: /cronograma/i });
    fireEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledOnce();
  });

  it('renderiza seção de descrição FSRS', () => {
    render(<Dashboard subjects={[]} onNavigateCronograma={vi.fn()} />);
    expect(screen.getByText(/algoritmo FSRS v6/i)).toBeInTheDocument();
  });

  it('navega no minicalendário de revisões agendadas', () => {
    const subjects = [makeSubject({ id: 'sub-rev', currentStage: 'Review', nextReviewDate: today })];
    const onNavigateCronograma = vi.fn();
    render(<Dashboard subjects={subjects} onNavigateCronograma={onNavigateCronograma} />);

    const btnNavigate = screen.getAllByTitle('Ir para o Cronograma')[0];
    if(btnNavigate) fireEvent.click(btnNavigate);
    expect(onNavigateCronograma).toHaveBeenCalled();

    // Navegar nos dias
    const btnLeft = document.querySelector('button > svg.lucide-chevron-left');
    const btnRight = document.querySelector('button > svg.lucide-chevron-right');

    if(btnLeft) fireEvent.click(btnLeft!.closest('button')!);
    if(btnRight) {
      fireEvent.click(btnRight!.closest('button')!);
      fireEvent.click(btnRight!.closest('button')!); // Avança 2 dias
    }
  });
});
