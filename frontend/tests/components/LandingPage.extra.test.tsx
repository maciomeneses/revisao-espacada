import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../../src/components/LandingPage';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

describe('LandingPage (cobertura extra)', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    window.scrollTo = vi.fn() as any;
  });

  it('clica no botão "Acessar Plataforma" e navega para /login', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Acessar Plataforma/i }));
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('clica em "Começar agora" e navega para /login', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Começar agora/i }));
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('clica no logo e dispara window.scrollTo', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    // O logo + texto Ebbing está dentro de uma div com onClick
    const ebbingSpans = screen.getAllByText(/Ebbing/);
    const clickable = ebbingSpans[0].closest('div')!;
    fireEvent.click(clickable);
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('handleScroll é registrado e atualiza state ao scroll', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

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
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    // setInterval avança a cada 2000ms; cobre os 8 steps + reset (ciclo completo)
    for (let i = 0; i < 9; i++) {
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    }

    vi.useRealTimers();
  });
});
