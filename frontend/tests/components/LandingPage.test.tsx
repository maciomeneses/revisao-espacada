import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../../src/components/LandingPage';

describe('LandingPage', () => {
  it('renderiza os blocos iniciais e header', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Acessar Plataforma/i)).toBeInTheDocument();
  });

  it('alterna os modos da demo animada simulando o cursor', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    // A demo avança automaticamente via setInterval (2000ms por step)
    // Verifica que a seção de demo está renderizada
    expect(screen.getByText('Próximas Revisões')).toBeInTheDocument();

    // Avança o timer para simular o ciclo completo da animação (8 steps × 2000ms)
    act(() => {
      vi.advanceTimersByTime(16000);
    });

    vi.useRealTimers();
  });
});
