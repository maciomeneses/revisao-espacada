import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Agenda } from '../../src/components/Agenda';
import type { Subject } from '../../src/types';
import { localDateStr } from '../../src/services/algorithm';

function makeSubject(o: Partial<Subject> = {}): Subject {
  return {
    id: 's1',
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

describe('Agenda (cobertura extra)', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn() as any;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Fixa o relógio no meio do mês para que "hoje ± 3 dias" nunca cruze a
   * borda do mês — o calendário renderiza apenas o mês corrente, então uma
   * data alvo em outro mês fazia o clique acertar a célula errada (flake nos
   * 3 primeiros/últimos dias de cada mês; ver issue #61).
   */
  function pinMidMonth(): void {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00'));
  }

  it('navega semanas para frente e para trás', () => {
    render(<Agenda subjects={[]} />);

    const chevs = document.querySelectorAll('.lucide-chevron-left, .lucide-chevron-right');
    fireEvent.click(chevs[0].closest('button')!); // back
    fireEvent.click(chevs[1].closest('button')!); // forward
  });

  it('Mês: navega para mês anterior e próximo, e seleciona um dia', () => {
    const today = localDateStr(new Date());
    const subjects = [makeSubject({ id: 's1', nextReviewDate: today })];

    render(<Agenda subjects={subjects} />);
    fireEvent.click(screen.getByRole('button', { name: /Mês/i }));

    const chevs = document.querySelectorAll('.lucide-chevron-left, .lucide-chevron-right');
    fireEvent.click(chevs[0].closest('button')!); // prev month
    fireEvent.click(chevs[1].closest('button')!); // next month

    // Volta ao mês atual: seleciona um dia (digito do calendário)
    fireEvent.click(chevs[0].closest('button')!);
    const todayDay = String(new Date().getDate());
    const dayBtns = screen.getAllByText(todayDay);
    fireEvent.click(dayBtns[0].closest('button')!);
  });

  it('Mês: dia selecionado no passado mostra "Atrasado"', () => {
    pinMidMonth();
    const past = new Date();
    past.setDate(past.getDate() - 3);
    const pastStr = localDateStr(past);

    const subjects = [makeSubject({ id: 's1', nextReviewDate: pastStr })];
    render(<Agenda subjects={subjects} />);
    fireEvent.click(screen.getByRole('button', { name: /Mês/i }));

    // Clica no dia do passado (3 dias atrás)
    const day = String(past.getDate());
    const cells = screen.getAllByText(day);
    fireEvent.click(cells[0].closest('button')!);

    expect(screen.getByText('Atrasado')).toBeInTheDocument();
  });

  it('Mês: dia futuro mostra "Agendado"', () => {
    pinMidMonth();
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const futureStr = localDateStr(future);

    const subjects = [makeSubject({ id: 's1', nextReviewDate: futureStr })];
    render(<Agenda subjects={subjects} />);
    fireEvent.click(screen.getByRole('button', { name: /Mês/i }));

    const day = String(future.getDate());
    const cells = screen.getAllByText(day);
    fireEvent.click(cells[0].closest('button')!);

    expect(screen.getByText('Agendado')).toBeInTheDocument();
  });
});
