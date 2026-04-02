import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Cronograma } from '../../src/components/Cronograma';
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
  onRegisterReview: vi.fn(),
  onRegisterFixacao: vi.fn(),
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

  it('abre modal de fixação ao clicar no botão Fixação', () => {
    const subjects = [makeSubject({ id: 'sub-test' })];
    render(<Cronograma {...defaultProps} subjects={subjects} />);

    fireEvent.click(screen.getByRole('button', { name: /fixação/i }));
    expect(screen.getByText(/Registro de Fixação/i)).toBeInTheDocument();
  });

  it('chama onRegisterFixacao ao confirmar fixação', () => {
    const onRegisterFixacao = vi.fn();
    const subjects = [makeSubject({ id: 'sub-test' })];
    render(<Cronograma {...defaultProps} subjects={subjects} onRegisterFixacao={onRegisterFixacao} />);

    fireEvent.click(screen.getByRole('button', { name: /fixação/i }));
    // totalQuestions='10' (default), numCorrect=8 → normalized = round(8/10*10) = 8
    fireEvent.change(screen.getByLabelText(/acertos/i), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onRegisterFixacao).toHaveBeenCalledWith('sub-test', 8, 10, 80);
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
    expect(onRegisterReview).toHaveBeenCalledWith('sub-test', 9, 10, 90);
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
