import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../../src/components/LandingPage';

describe('LandingPage', () => {
  it('renderiza os blocos iniciais e header', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Acessar Plataforma/i)).toBeInTheDocument();
  });

  it('alterna os modos da demo animada simulando o cursor', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const btnDemo = screen.getByRole('button', { name: /Ver demonstração/i });
    expect(btnDemo).toBeInTheDocument();
    
    // Simulate clicking demo button which drives the state forward
    fireEvent.click(btnDemo);

    // Fast-forward fake timers dynamically until state changes up to 10 seconds
    vi.advanceTimersByTime(2000); // changes to 'reviewing'
    vi.advanceTimersByTime(2000); // changes to 'success'
    vi.advanceTimersByTime(3000); // changes back to 'idle'

    vi.useRealTimers();
  });
});
