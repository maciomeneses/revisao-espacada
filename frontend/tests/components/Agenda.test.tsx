import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Agenda } from '../../src/components/Agenda';
import type { Subject } from '../../src/types';

describe('Agenda', () => {
  const today = new Date().toISOString().split('T')[0];

  const mockSubjects: Subject[] = [
    {
      id: 'sub-1', modulo: 'Módulo 1', area: 'Ciências', aulaPrincipal: 'Biologia', relevancia: 'Alta',
      aulaAssistida: false, preAulaFeita: false, flashcardsFeitos: false, currentStage: 'aula',
      nextReviewDate: today, lastReviewDate: null, lastPerformance: null, performanceLevel: 'iniciante',
    },
    {
      id: 'sub-2', modulo: 'Módulo 1', area: 'Matemática', aulaPrincipal: 'Álgebra', relevancia: 'Alta',
      aulaAssistida: true, preAulaFeita: true, flashcardsFeitos: true, currentStage: 'Review',
      nextReviewDate: today, lastReviewDate: today, lastPerformance: null, performanceLevel: 'dominado',
    }
  ];

  it('renderiza calendarios Semana e Mês trocando entre as views', () => {
    // mock window.scrollTo
    window.scrollTo = vi.fn();
    render(<Agenda subjects={mockSubjects} />);
    
    expect(screen.getByText(/Agenda/i)).toBeInTheDocument();
    
    // Default is Week view, so DOM will have cards mapped
    expect(screen.getByText('Biologia')).toBeInTheDocument();

    const mesToggle = screen.getByRole('button', { name: /Mês/i });
    fireEvent.click(mesToggle);

    // After switching to Month view, we should see the month title e.g. "Julho 2024" pattern
    // And days mapped to number grid
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    
    // Back to week
    const semanaToggle = screen.getByRole('button', { name: /Semana/i });
    fireEvent.click(semanaToggle);

    expect(screen.getByText('Biologia')).toBeInTheDocument();
  });
});
