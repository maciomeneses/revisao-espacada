import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Cronograma } from '../../src/components/Cronograma';
import { localDateStr } from '../../src/services/algorithm';
import type { Subject } from '../../src/types';

// useCatalog: precisa de api mock para não falhar
vi.mock('../../src/services/api', () => ({
  api: {
    areas: { list: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    disciplines: { list: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

const today = localDateStr(new Date());

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

const defaultProps = {
  subjects: [] as Subject[],
  onToggleAula: vi.fn(),
  onRegisterReview: vi.fn(),
  onRegisterFixacao: vi.fn(),
  onResetCiclo: vi.fn(),
  onRevertStage: vi.fn(),
};

describe('Cronograma (cobertura extra)', () => {
  it('alterna tabs de áreas filtrando subjects', () => {
    const subjects = [
      makeSubject({ id: '1', area: 'Matemática', aulaPrincipal: 'Mat 1' }),
      makeSubject({ id: '2', area: 'Física', aulaPrincipal: 'Fis 1' }),
    ];
    render(<Cronograma {...defaultProps} subjects={subjects} />);

    // Por padrão, '__all__' é selecionado
    expect(screen.getByText('Mat 1')).toBeInTheDocument();
    expect(screen.getByText('Fis 1')).toBeInTheDocument();

    // Filtra para Matemática
    fireEvent.click(screen.getByRole('button', { name: /Matemática/i }));
    expect(screen.getByText('Mat 1')).toBeInTheDocument();
    expect(screen.queryByText('Fis 1')).not.toBeInTheDocument();
  });

  it('relevancia Média e Baixa renderizam badges', () => {
    const subjects = [
      makeSubject({ id: '1', relevancia: 'Média', aulaPrincipal: 'Med' }),
      makeSubject({ id: '2', relevancia: 'Baixa', aulaPrincipal: 'BaixaT' }),
    ];
    render(<Cronograma {...defaultProps} subjects={subjects} />);
    expect(screen.getByText('Média')).toBeInTheDocument();
    expect(screen.getByText('Baixa')).toBeInTheDocument();
  });

  it('formError: total <= 0 exibe mensagem', () => {
    const subjects = [makeSubject({ id: 'x' })];
    render(<Cronograma {...defaultProps} subjects={subjects} />);

    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));
    const numberInputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(numberInputs[0]!, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByText(/maior que zero/i)).toBeInTheDocument();
  });

  it('formError: acertos > total exibe mensagem', () => {
    const subjects = [makeSubject({ id: 'x' })];
    render(<Cronograma {...defaultProps} subjects={subjects} />);

    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));
    const numberInputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(numberInputs[0]!, { target: { value: '5' } });
    fireEvent.change(numberInputs[1]!, { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByText(/não podem ser maiores/i)).toBeInTheDocument();
  });

  it('parseDuration: formato hh:mm:ss converte para segundos', () => {
    const onRegisterReview = vi.fn();
    const subjects = [makeSubject({ id: 'x' })];
    render(
      <Cronograma {...defaultProps} subjects={subjects} onRegisterReview={onRegisterReview} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));
    const tempoInput = screen.getByPlaceholderText('00:30:00');
    fireEvent.change(tempoInput, { target: { value: '1:02:03' } });

    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(onRegisterReview).toHaveBeenCalledWith('x', 7, 10, 70, today, 3723);
  });

  it('parseDuration: formato mm:ss converte para segundos', () => {
    const onRegisterReview = vi.fn();
    const subjects = [makeSubject({ id: 'x' })];
    render(
      <Cronograma {...defaultProps} subjects={subjects} onRegisterReview={onRegisterReview} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));
    const tempoInput = screen.getByPlaceholderText('00:30:00');
    fireEvent.change(tempoInput, { target: { value: '5:30' } });

    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onRegisterReview).toHaveBeenCalledWith('x', 7, 10, 70, today, 330);
  });

  it('parseDuration: formato inválido (NaN) retorna 0', () => {
    const onRegisterReview = vi.fn();
    const subjects = [makeSubject({ id: 'x' })];
    render(
      <Cronograma {...defaultProps} subjects={subjects} onRegisterReview={onRegisterReview} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));
    fireEvent.change(screen.getByPlaceholderText('00:30:00'), {
      target: { value: 'abc:xyz' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onRegisterReview).toHaveBeenCalledWith('x', 7, 10, 70, today, 0);
  });

  it('highlightedSubjectId: scroll e flash são acionados', () => {
    vi.useFakeTimers();
    const onCleared = vi.fn();
    const subjects = [makeSubject({ id: 'hl', aulaPrincipal: 'Highlight' })];

    // mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    render(
      <Cronograma
        {...defaultProps}
        subjects={subjects}
        highlightedSubjectId="hl"
        onHighlightCleared={onCleared}
      />,
    );

    vi.advanceTimersByTime(80);
    vi.advanceTimersByTime(1800);

    expect(onCleared).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('lastReviewDate definido renderiza data formatada (cobre fmtDate)', () => {
    const subjects = [
      makeSubject({ id: '1', lastReviewDate: '2024-01-15T10:00:00Z' }),
    ];
    render(<Cronograma {...defaultProps} subjects={subjects} />);
    // formato dd-mm-yyyy — apenas garantimos que existe um texto com hifens
    const elements = document.body.textContent ?? '';
    expect(elements).toMatch(/\d{2}-\d{2}-\d{4}/);
  });
});
