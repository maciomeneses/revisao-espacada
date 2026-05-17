import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Pomodoro } from '../../src/components/Pomodoro';

describe('Pomodoro', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('estado inicial mostra modo foco com 25:00 e label "Time to focus!"', () => {
    render(<Pomodoro />);
    expect(screen.getByText('Time to focus!')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('botão inicial é "Iniciar" (Play)', () => {
    render(<Pomodoro />);
    expect(screen.getByLabelText('Iniciar')).toBeInTheDocument();
    expect(screen.queryByLabelText('Pausar')).not.toBeInTheDocument();
  });

  it('clicar em iniciar troca para "Pausar" e roda o timer', () => {
    render(<Pomodoro />);
    fireEvent.click(screen.getByLabelText('Iniciar'));
    expect(screen.getByLabelText('Pausar')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('24:59')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('24:54')).toBeInTheDocument();
  });

  it('clicar em pausar interrompe a contagem', () => {
    render(<Pomodoro />);
    fireEvent.click(screen.getByLabelText('Iniciar'));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('24:57')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Pausar'));
    expect(screen.getByLabelText('Iniciar')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // Não avançou enquanto pausado
    expect(screen.getByText('24:57')).toBeInTheDocument();
  });

  it('botão "Pular" troca de foco para pausa e reseta tempo para 05:00', () => {
    render(<Pomodoro />);
    fireEvent.click(screen.getByLabelText('Pular'));
    expect(screen.getByText('Break time!')).toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();
    // Pular sempre coloca o timer em pausa
    expect(screen.getByLabelText('Iniciar')).toBeInTheDocument();
  });

  it('botão "Pular" duas vezes volta para foco com 25:00', () => {
    render(<Pomodoro />);
    fireEvent.click(screen.getByLabelText('Pular'));
    fireEvent.click(screen.getByLabelText('Pular'));
    expect(screen.getByText('Time to focus!')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('quando o timer chega a zero, transita para fase de pausa automaticamente', () => {
    render(<Pomodoro />);
    fireEvent.click(screen.getByLabelText('Iniciar'));

    // Avança 25 minutos completos
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    expect(screen.getByText('Break time!')).toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();
    // Após a transição automática, fica pausado
    expect(screen.getByLabelText('Iniciar')).toBeInTheDocument();
  });

  it('pular durante o foco com timer rodando para a contagem', () => {
    render(<Pomodoro />);
    fireEvent.click(screen.getByLabelText('Iniciar'));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByLabelText('Pular'));
    expect(screen.getByLabelText('Iniciar')).toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // Permaneceu em 05:00 pois está pausado
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('formata segundos com dois dígitos', () => {
    render(<Pomodoro />);
    fireEvent.click(screen.getByLabelText('Iniciar'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // 24:59 — dois dígitos
    expect(screen.getByText('24:59')).toBeInTheDocument();
  });
});
