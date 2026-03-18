import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Cronograma } from '../../src/components/Cronograma';
import type { Subject } from '../../src/types';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

function makeSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: 'sub-1',
    modulo: 'Módulo 1',
    area: 'Matemática',
    aulaPrincipal: 'Álgebra Linear',
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
  subjects: [],
  onToggleAula: vi.fn(),
  onTogglePreAula: vi.fn(),
  onToggleFlashcards: vi.fn(),
  onRegisterReview: vi.fn(),
  onResetCiclo: vi.fn(),
  onRevertStage: vi.fn(),
};

describe('Cronograma', () => {
  it('renderiza cabeçalho e badge FSRS', () => {
    render(<Cronograma {...defaultProps} />);
    expect(screen.getByText('Cronograma')).toBeInTheDocument();
    expect(screen.getByText(/FSRS/i)).toBeInTheDocument();
  });

  it('renderiza cards para cada subject', () => {
    const subjects = [
      makeSubject({ id: '1', aulaPrincipal: 'Álgebra' }),
      makeSubject({ id: '2', aulaPrincipal: 'Geometria' }),
    ];
    render(<Cronograma {...defaultProps} subjects={subjects} />);
    expect(screen.getByText('Álgebra')).toBeInTheDocument();
    expect(screen.getByText('Geometria')).toBeInTheDocument();
  });

  it('chama onToggleAula ao clicar no botão Aula', () => {
    const onToggleAula = vi.fn();
    const subjects = [makeSubject({ id: 'sub-test' })];
    render(<Cronograma {...defaultProps} subjects={subjects} onToggleAula={onToggleAula} />);

    const btn = screen.getByRole('button', { name: /^Aula$/i });
    fireEvent.click(btn);
    expect(onToggleAula).toHaveBeenCalledWith('sub-test');
  });

  it('chama onTogglePreAula ao clicar no botão Pré-Aula', () => {
    const onTogglePreAula = vi.fn();
    const subjects = [makeSubject({ id: 'sub-test' })];
    render(<Cronograma {...defaultProps} subjects={subjects} onTogglePreAula={onTogglePreAula} />);

    const btn = screen.getByRole('button', { name: /pré-aula/i });
    fireEvent.click(btn);
    expect(onTogglePreAula).toHaveBeenCalledWith('sub-test');
  });

  it('chama onToggleFlashcards ao clicar no botão Cards', () => {
    const onToggleFlashcards = vi.fn();
    const subjects = [makeSubject({ id: 'sub-test' })];
    render(<Cronograma {...defaultProps} subjects={subjects} onToggleFlashcards={onToggleFlashcards} />);

    const btn = screen.getByRole('button', { name: /cards/i });
    fireEvent.click(btn);
    expect(onToggleFlashcards).toHaveBeenCalledWith('sub-test');
  });

  it('abre modal de revisão ao clicar em REVISAR', () => {
    const subjects = [makeSubject({ id: 'sub-test' })];
    render(<Cronograma {...defaultProps} subjects={subjects} />);

    const reviewBtn = screen.getByRole('button', { name: /revisar/i });
    fireEvent.click(reviewBtn);

    expect(screen.getByText(/Registro de Revisão/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/acertos/i)).toBeInTheDocument();
  });

  it('fecha modal ao clicar em Cancelar', () => {
    const subjects = [makeSubject({ id: 'sub-test' })];
    render(<Cronograma {...defaultProps} subjects={subjects} />);

    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));
    expect(screen.getByText(/Registro de Revisão/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByText(/Registro de Revisão/i)).not.toBeInTheDocument();
  });

  it('chama onRegisterReview com id e numCorrect ao confirmar revisão', () => {
    const onRegisterReview = vi.fn();
    const subjects = [makeSubject({ id: 'sub-test' })];
    render(<Cronograma {...defaultProps} subjects={subjects} onRegisterReview={onRegisterReview} />);

    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));

    // totalQuestions = 10 (default), numCorrect = 9 → normalized = round(9/10 * 10) = 9
    const acertosInput = screen.getByLabelText(/acertos/i);
    fireEvent.change(acertosInput, { target: { value: '9' } });

    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onRegisterReview).toHaveBeenCalledWith('sub-test', 9);
  });

  it('exibe badge "Atrasado" para subjects com nextReviewDate no passado', () => {
    const subjects = [makeSubject({
      id: '1',
      currentStage: 'Review',
      nextReviewDate: yesterday,
      stability: 5,
    })];
    render(<Cronograma {...defaultProps} subjects={subjects} />);
    expect(screen.getByText('Atrasado')).toBeInTheDocument();
  });

  it('exibe badge "Hoje" para subjects com nextReviewDate hoje', () => {
    const subjects = [makeSubject({
      id: '1',
      currentStage: 'Review',
      nextReviewDate: today,
      stability: 5,
    })];
    render(<Cronograma {...defaultProps} subjects={subjects} />);
    expect(screen.getByText('Hoje')).toBeInTheDocument();
  });

  it('exibe badge "No Prazo" para subjects com nextReviewDate no futuro', () => {
    const subjects = [makeSubject({
      id: '1',
      currentStage: 'Review',
      nextReviewDate: tomorrow,
      stability: 5,
    })];
    render(<Cronograma {...defaultProps} subjects={subjects} />);
    expect(screen.getByText('No Prazo')).toBeInTheDocument();
  });

  it('exibe "Iniciante" para stability indefinida', () => {
    const subjects = [makeSubject({ id: '1', stability: undefined })];
    render(<Cronograma {...defaultProps} subjects={subjects} />);
    expect(screen.getByText('Iniciante')).toBeInTheDocument();
  });

  it('não renderiza nenhum card quando subjects está vazio', () => {
    render(<Cronograma {...defaultProps} subjects={[]} />);
    // No cards — only the header should be visible
    expect(screen.queryByRole('button', { name: /revisar/i })).not.toBeInTheDocument();
  });
});
