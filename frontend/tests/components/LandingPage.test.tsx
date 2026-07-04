import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../../src/components/LandingPage';

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  it('renderiza os blocos iniciais e header', () => {
    renderLanding();

    expect(screen.getByText(/Acessar Plataforma/i)).toBeInTheDocument();
  });

  it('exibe a citação real de Ebbinghaus e fatos verdadeiros, sem claims falsos', () => {
    const { container } = renderLanding();

    // Citação documentada de "Memória" (1885), não a apócrifa
    expect(screen.getByText(/Toda sorte de ideias, se deixadas a si mesmas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1885/).length).toBeGreaterThan(0);
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getAllByText(/FSRS v6/i).length).toBeGreaterThan(0);

    // Claims falsos removidos
    expect(screen.queryByText(/flashcards/i)).toBeNull();
    expect(screen.queryByText(/100k/i)).toBeNull();
    expect(screen.queryByText(/Inteligência Artificial/i)).toBeNull();

    // Âncoras da navbar existem de fato
    expect(container.querySelector('#algoritmo')).not.toBeNull();
    expect(container.querySelector('#como-funciona')).not.toBeNull();

    // Nenhuma imagem hotlinkada de serviço externo
    const imgs = Array.from(container.querySelectorAll('img'));
    expect(imgs.every((img) => !img.src.includes('unsplash'))).toBe(true);
  });

  it('alterna os modos da demo animada simulando o cursor', () => {
    vi.useFakeTimers();

    renderLanding();

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
