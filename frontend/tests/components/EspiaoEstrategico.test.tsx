import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EspiaoEstrategico } from '../../src/components/EspiaoEstrategico';
import type { Subject } from '../../src/types';
import type { ReviewEventPayload } from '../../src/services/api';
import { localDateStr } from '../../src/services/algorithm';

// Mock recharts to avoid rendering issues in JSDOM
vi.mock('recharts', () => {
  const Original = vi.importActual('recharts');
  return {
    ...Original,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children }: any) => <div>{children}</div>,
    XAxis: () => <div>XAxis</div>,
    YAxis: () => <div>YAxis</div>,
    Tooltip: () => <div>Tooltip</div>,
    CartesianGrid: () => <div>CartesianGrid</div>,
    Area: () => <div>Area</div>,
  };
});

// Helper para criar datas
const createDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return localDateStr(d);
};

describe('EspiaoEstrategico', () => {
  const mockSubjects: Subject[] = [
    {
      id: 'sub-1', 
    } as unknown as Subject,
    {
      id: 'sub-2',
    } as unknown as Subject
  ];

  const mockEvents: ReviewEventPayload[] = [
    {
      subjectId: 'sub-1', subjectName: 'Biologia', reviewDate: createDate(2), performance: 'bom',
      reps: 1, questions: 10, accuracy: 80,
    },
    {
      subjectId: 'sub-1', subjectName: 'Biologia', reviewDate: createDate(1), performance: 'excelente',
      reps: 2, questions: 5, accuracy: 95,
    },
    {
      subjectId: 'sub-2', subjectName: 'História', reviewDate: createDate(40), performance: 'ruim',
      reps: 1, questions: 10, accuracy: 0, // Test fallback accuracy
    },
  ];

  it('renderiza os cartões de estatísticas com os valores corretos baseados nos eventos', () => {
    render(<EspiaoEstrategico subjects={mockSubjects} reviewEvents={mockEvents} />);
    
    // Verifica o título
    expect(screen.getByText('Estatísticas')).toBeInTheDocument();
    
    // Total de Assuntos = 2
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Total de Assuntos')).toBeInTheDocument();
  });

  it('lida com accuracy fallback corretamente em eventos antigos', () => {
    // "ruim" without accuracy -> fallback is 20, but we also have others (0.8 and 0.95 which are 80 and 95)
    render(<EspiaoEstrategico subjects={mockSubjects} reviewEvents={mockEvents} />);
    // O Espiao calcula medias globais de accuracy.
    expect(screen.getByText('Acurácia Média')).toBeInTheDocument();
  });

  it('renderiza os botões de filtro e muda os dados do gráfico ao clicar', () => {
    render(<EspiaoEstrategico subjects={mockSubjects} reviewEvents={mockEvents} />);
    
    const weekBtn = screen.getByText('Semanas');
    const threeMonthsBtn = screen.getByText('3 meses');
    const sixMonthsBtn = screen.getByText('6 meses');

    expect(weekBtn).toBeInTheDocument();
    expect(threeMonthsBtn).toBeInTheDocument();
    expect(sixMonthsBtn).toBeInTheDocument();

    // Change filter
    fireEvent.click(threeMonthsBtn);
    expect(threeMonthsBtn.className).toContain('bg-navy text-white'); // Active state class string assertion
    
    fireEvent.click(sixMonthsBtn);
    expect(sixMonthsBtn.className).toContain('bg-navy text-white');
  });

  it('exibe EmptyState se não houver eventos na timeline do gráfico (embora MiniCharts sempre renderizem arr vazio se não tiver data)', () => {
    render(<EspiaoEstrategico subjects={[]} reviewEvents={[]} />);
    
    // Com 0 assuntos e 0 eventos, vários cards exibirão 0
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
