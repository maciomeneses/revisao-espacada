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

/**
 * Retorna o valor do stat card cujo label é `label`.
 * Usa getAllByText para lidar com casos em que o mesmo texto aparece em múltiplos
 * lugares (ex: label do card + cabeçalho de seção).
 * O label do stat card é sempre um <p> cujo próximo irmão também é um <p> com o valor.
 */
function getStatValue(label: string): string {
  const elements = screen.getAllByText(label);
  const labelEl =
    elements.find((el) => el.tagName === 'P' && el.nextElementSibling?.tagName === 'P') ??
    elements[0];
  const valueEl = labelEl.nextElementSibling;
  return valueEl?.textContent ?? '';
}

const defaultProps = {
  onNavigateCronograma: vi.fn(),
  onRegisterReview: vi.fn(),
  routine: [],
  availableAreas: [],
  onAddSlot: vi.fn(),
  onUpdateSlot: vi.fn(),
  onRemoveSlot: vi.fn(),
  allowedDays: new Set([0, 1, 2, 3, 4, 5, 6]),
  onToggleDay: vi.fn(),
};

describe('Dashboard', () => {
  it('renderiza cards de estatísticas com rótulos corretos', () => {
    render(<Dashboard subjects={[]} {...defaultProps} />);
    expect(screen.getByText('Total de Matérias')).toBeInTheDocument();
    // getAllByText para o label que pode aparecer no card e no header da seção
    expect(screen.getAllByText('Revisões para Hoje').length).toBeGreaterThan(0);
  });

  it('exibe total de matérias correto', () => {
    const subjects = [makeSubject({ id: '1' }), makeSubject({ id: '2' })];
    render(<Dashboard subjects={subjects} {...defaultProps} />);
    expect(getStatValue('Total de Matérias')).toBe('2');
  });

  it('conta corretamente revisões pendentes — só até hoje, não futuras', () => {
    const subjects = [
      makeSubject({ id: '1', nextReviewDate: tomorrow }),
      makeSubject({ id: '2', nextReviewDate: today }),
      makeSubject({ id: '3', nextReviewDate: yesterday }),
    ];
    render(<Dashboard subjects={subjects} {...defaultProps} />);
    // today + yesterday = 2; tomorrow should NOT be counted
    expect(getStatValue('Revisões para Hoje')).toBe('2');
  });

  it('todos os contadores são 0 com lista vazia', () => {
    render(<Dashboard subjects={[]} {...defaultProps} />);
    expect(getStatValue('Total de Matérias')).toBe('0');
    expect(getStatValue('Revisões para Hoje')).toBe('0');
  });

  it('chama onNavigateCronograma ao clicar no botão', () => {
    const mockNavigate = vi.fn();
    render(
      <Dashboard
        subjects={[]}
        onNavigateCronograma={mockNavigate}
        onRegisterReview={vi.fn()}
        routine={[]}
        availableAreas={[]}
        onAddSlot={vi.fn()}
        onUpdateSlot={vi.fn()}
        onRemoveSlot={vi.fn()}
        allowedDays={new Set([0, 1, 2, 3, 4, 5, 6])}
        onToggleDay={vi.fn()}
      />,
    );

    const btn = screen.getByRole('button', { name: /cronograma/i });
    fireEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledOnce();
  });

  it('renderiza seção de descrição FSRS', () => {
    render(<Dashboard subjects={[]} {...defaultProps} />);
    expect(screen.getByText(/algoritmo FSRS v6/i)).toBeInTheDocument();
  });

  it('botão Revisar no card abre modal de revisão', () => {
    const subjects = [
      makeSubject({ id: 'sub-rev', currentStage: 'Review', nextReviewDate: today }),
    ];
    render(<Dashboard subjects={subjects} {...defaultProps} />);

    const revisarBtn = screen.getByRole('button', { name: /^Revisar$/i });
    fireEvent.click(revisarBtn);

    expect(screen.getByText(/Registro de Revisão/i)).toBeInTheDocument();
  });

  it('confirma revisão chamando onRegisterReview com os dados corretos', () => {
    const onRegisterReview = vi.fn();
    const subjects = [
      makeSubject({ id: 'sub-rev', currentStage: 'Review', nextReviewDate: today }),
    ];
    render(
      <Dashboard
        subjects={subjects}
        onNavigateCronograma={vi.fn()}
        onRegisterReview={onRegisterReview}
        routine={[]}
        availableAreas={[]}
        onAddSlot={vi.fn()}
        onUpdateSlot={vi.fn()}
        onRemoveSlot={vi.fn()}
        allowedDays={new Set([0, 1, 2, 3, 4, 5, 6])}
        onToggleDay={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Revisar$/i }));
    // numCorrect default é 7, totalQuestions default é 10 → normalized=7, accuracy=70
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(onRegisterReview).toHaveBeenCalledWith('sub-rev', 7, 10, 70, today, 0);
  });

  it('navega no minicalendário de revisões agendadas', () => {
    const subjects = [
      makeSubject({ id: 'sub-rev', currentStage: 'Review', nextReviewDate: today }),
    ];
    render(<Dashboard subjects={subjects} {...defaultProps} />);

    // Navegar nos dias
    const btnLeft = document.querySelector('button > svg.lucide-chevron-left');
    const btnRight = document.querySelector('button > svg.lucide-chevron-right');

    if (btnLeft) fireEvent.click(btnLeft!.closest('button')!);
    if (btnRight) {
      fireEvent.click(btnRight!.closest('button')!);
      fireEvent.click(btnRight!.closest('button')!); // Avança 2 dias
    }
  });
});
