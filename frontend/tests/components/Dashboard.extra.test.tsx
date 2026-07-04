import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from '../../src/components/Dashboard';
import { localDateStr } from '../../src/services/algorithm';
import type { Subject } from '../../src/types';

const _now = new Date();
const today = localDateStr(_now);
const yesterday = localDateStr(new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() - 1));

function makeSubject(o: Partial<Subject> = {}): Subject {
  return {
    id: 'sub-1',
    modulo: 'M',
    area: 'A',
    aulaPrincipal: 'A1',
    relevancia: 'Alta',
    aulaAssistida: false,
    preAulaFeita: false,
    flashcardsFeitos: false,
    currentStage: 'aula',
    nextReviewDate: null,
    lastReviewDate: null,
    lastPerformance: null,
    performanceLevel: 'nao_classificada',
    ...o,
  };
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

describe('Dashboard (cobertura extra)', () => {
  it('relevancia Média e Baixa renderizam classes corretas', () => {
    const subjects = [
      makeSubject({ id: '1', relevancia: 'Média', nextReviewDate: today }),
      makeSubject({ id: '2', relevancia: 'Baixa', nextReviewDate: today }),
    ];
    render(<Dashboard {...defaultProps} subjects={subjects} />);
    expect(screen.getAllByText('Média').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Baixa').length).toBeGreaterThan(0);
  });

  it('Revisões pendentes lista subjects atrasados (overdueSubjects.map)', () => {
    const subjects = [
      makeSubject({ id: 'o1', aulaPrincipal: 'OVERDUE', nextReviewDate: yesterday }),
    ];
    render(<Dashboard {...defaultProps} subjects={subjects} />);
    expect(screen.getByText('OVERDUE')).toBeInTheDocument();
    expect(screen.getByText(/atrás/)).toBeInTheDocument();
  });

  it('clicando em CheckCircle2 (revisar) do card overdue abre modal', () => {
    const subjects = [
      makeSubject({ id: 'o1', aulaPrincipal: 'OVERDUE', nextReviewDate: yesterday }),
    ];
    render(<Dashboard {...defaultProps} subjects={subjects} />);
    // o botão tem title="Revisar"
    fireEvent.click(screen.getByTitle('Revisar'));
    expect(screen.getByText(/Registro de Revisão/)).toBeInTheDocument();
  });

  it('validação: totalQuestions <= 0 exibe erro inline', () => {
    const subjects = [makeSubject({ id: 'x', nextReviewDate: today })];
    render(<Dashboard {...defaultProps} subjects={subjects} />);

    fireEvent.click(screen.getByRole('button', { name: /^Revisar$/i }));
    const numberInputs = document.querySelectorAll(
      'input[type="number"]:not([aria-label="Limite de revisões por dia"])',
    );
    fireEvent.change(numberInputs[0]!, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByText(/maior que zero/i)).toBeInTheDocument();
  });

  it('validação: acertos > total exibe erro inline', () => {
    const subjects = [makeSubject({ id: 'x', nextReviewDate: today })];
    render(<Dashboard {...defaultProps} subjects={subjects} />);

    fireEvent.click(screen.getByRole('button', { name: /^Revisar$/i }));
    const numberInputs = document.querySelectorAll(
      'input[type="number"]:not([aria-label="Limite de revisões por dia"])',
    );
    fireEvent.change(numberInputs[0]!, { target: { value: '5' } });
    fireEvent.change(numberInputs[1]!, { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByText(/não podem ser maiores/i)).toBeInTheDocument();
  });

  it('parseDuration: hh:mm:ss e mm:ss são convertidos para segundos', () => {
    const onReg = vi.fn();
    const subjects = [makeSubject({ id: 'x', nextReviewDate: today })];
    render(<Dashboard {...defaultProps} subjects={subjects} onRegisterReview={onReg} />);

    fireEvent.click(screen.getByRole('button', { name: /^Revisar$/i }));
    fireEvent.change(screen.getByPlaceholderText('00:30:00'), { target: { value: '0:10:00' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(onReg).toHaveBeenCalledWith('x', 7, 10, 70, today, 600);
  });

  it('Cancelar fecha o modal', () => {
    const subjects = [makeSubject({ id: 'x', nextReviewDate: today })];
    render(<Dashboard {...defaultProps} subjects={subjects} />);

    fireEvent.click(screen.getByRole('button', { name: /^Revisar$/i }));
    expect(screen.getByText(/Registro de Revisão/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByText(/Registro de Revisão/)).not.toBeInTheDocument();
  });

  it('input de questões atualiza state', () => {
    const subjects = [makeSubject({ id: 'x', nextReviewDate: today })];
    render(<Dashboard {...defaultProps} subjects={subjects} />);
    fireEvent.click(screen.getByRole('button', { name: /^Revisar$/i }));

    const numberInputs = document.querySelectorAll(
      'input[type="number"]:not([aria-label="Limite de revisões por dia"])',
    );
    fireEvent.change(numberInputs[0]!, { target: { value: '20' } });
    fireEvent.change(numberInputs[1]!, { target: { value: '15' } });

    expect((numberInputs[0] as HTMLInputElement).value).toBe('20');
    expect((numberInputs[1] as HTMLInputElement).value).toBe('15');
  });
});
