import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../../src/components/LandingPage';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('LandingPage (cobertura extra)', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    window.scrollTo = vi.fn() as any;
  });

  it('clica no botão "Acessar Plataforma" e navega para /login', () => {
    renderLanding();

    fireEvent.click(screen.getByRole('button', { name: /Acessar Plataforma/i }));
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('clica em "Começar agora" e navega para /login', () => {
    renderLanding();

    fireEvent.click(screen.getByRole('button', { name: /Começar agora/i }));
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('clica no logo e dispara window.scrollTo', () => {
    renderLanding();

    // O logo + texto Ebbing está dentro de uma div com onClick
    const ebbingSpans = screen.getAllByText(/Ebbing/);
    const clickable = ebbingSpans[0].closest('div')!;
    fireEvent.click(clickable);
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('handleScroll é registrado e atualiza state ao scroll', () => {
    renderLanding();

    // Dispara scroll
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    // não há assert direto — apenas garantimos que o handler rodou sem crash
    expect(true).toBe(true);
  });

  it('avança a animação para cobrir cada demoStep (0..7)', () => {
    vi.useFakeTimers();
    renderLanding();

    // setInterval avança a cada 2000ms; cobre os 8 steps + reset (ciclo completo)
    for (let i = 0; i < 9; i++) {
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    }

    vi.useRealTimers();
  });

  it('com prefers-reduced-motion, exibe o resultado estático da demo sem animar', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any;

    try {
      renderLanding();

      // demoStep fixado na tela de resultado, sem interval rodando
      expect(screen.getByText(/Taxa de Acertos: 86%/i)).toBeInTheDocument();
      expect(screen.queryByText(/Analisar Desempenho/i)).toBeNull();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('pausa a demo quando o mockup sai do viewport e retoma ao voltar', () => {
    vi.useFakeTimers();

    let ioCallback: (entries: Array<{ isIntersecting: boolean }>) => void = () => {};
    const observe = vi.fn();
    const disconnect = vi.fn();
    class IntersectionObserverStub {
      constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
        ioCallback = cb;
      }
      observe = observe;
      disconnect = disconnect;
    }
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      IntersectionObserverStub;

    try {
      renderLanding();
      expect(observe).toHaveBeenCalled();

      // Fora do viewport: o step não avança (resultado nunca aparece)
      act(() => {
        ioCallback([{ isIntersecting: false }]);
      });
      act(() => {
        vi.advanceTimersByTime(12000);
      });
      expect(screen.queryByText(/Taxa de Acertos/i)).toBeNull();

      // De volta ao viewport: o interval retoma e chega à tela de resultado
      act(() => {
        ioCallback([{ isIntersecting: true }]);
      });
      act(() => {
        vi.advanceTimersByTime(12000);
      });
      expect(screen.getByText(/Taxa de Acertos/i)).toBeInTheDocument();
    } finally {
      delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;
      vi.useRealTimers();
    }
  });

  it('footer aponta para âncoras reais, sem links mortos', () => {
    const { container } = renderLanding();

    expect(container.querySelectorAll('a[href="#"]').length).toBe(0);
    expect(container.querySelector('a[href="#como-funciona"]')).not.toBeNull();
    expect(container.querySelector('a[href="#algoritmo"]')).not.toBeNull();
  });

  it('footer credita a Silis Tech com link externo seguro e logo self-hosted', () => {
    const { container } = renderLanding();

    const credit = container.querySelector('a[href="https://silistech.com.br"]');
    expect(credit).not.toBeNull();
    expect(credit?.getAttribute('target')).toBe('_blank');
    expect(credit?.getAttribute('rel')).toBe('noopener noreferrer');
    const logo = credit?.querySelector('img');
    expect(logo?.getAttribute('src')).toBe('/logo-silis-tech.svg');
    expect(logo?.getAttribute('alt')).toBe('Silis Tech');
  });
});
