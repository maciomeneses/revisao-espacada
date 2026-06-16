import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EspiaoEstrategico } from '../../src/components/EspiaoEstrategico';
import type { Subject } from '../../src/types';
import type { ReviewEventPayload } from '../../src/services/api';
import { localDateStr } from '../../src/services/algorithm';

vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children }: any) => <div>{children}</div>,
    XAxis: () => <div />,
    YAxis: () => <div />,
    Tooltip: () => <div />,
    CartesianGrid: () => <div />,
    Area: () => <div />,
  };
});

const createDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return localDateStr(d);
};

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
    currentStage: 'Review',
    nextReviewDate: null,
    lastReviewDate: null,
    lastPerformance: null,
    performanceLevel: 'nao_classificada',
    ...o,
  };
}

describe('EspiaoEstrategico (cobertura extra)', () => {
  it('abre painel de histórico, navega area > subject > eventos e fecha', () => {
    const subjects: Subject[] = [
      makeSubject({ id: 's1', area: 'Matemática' }),
      makeSubject({ id: 's2', area: 'Física' }),
    ];

    const events: ReviewEventPayload[] = [
      {
        subjectId: 's1',
        subjectName: 'Sub1',
        reviewDate: createDate(1),
        performance: 'excelente',
        reps: 1,
        questions: 10,
        accuracy: 95,
        durationSeconds: 3725,
      },
      {
        subjectId: 's1',
        subjectName: 'Sub1',
        reviewDate: createDate(2),
        performance: 'bom',
        reps: 2,
        questions: 5,
        accuracy: 80,
        durationSeconds: 60,
      },
      {
        subjectId: 's2',
        subjectName: 'Sub2',
        reviewDate: createDate(3),
        performance: 'medio',
        reps: 1,
        questions: 4,
        accuracy: 55,
      },
      {
        subjectId: 's2',
        subjectName: 'Sub2',
        reviewDate: createDate(4),
        performance: 'ruim',
        reps: 2,
        questions: 4,
        accuracy: 20,
      },
    ];

    render(<EspiaoEstrategico subjects={subjects} reviewEvents={events} />);

    // Abre o painel via card "Revisões Concluídas"
    fireEvent.click(screen.getByText(/Revisões Concluídas/));

    // Nível 1: áreas
    const matBtn = screen.getByRole('button', { name: /Matemática/ });
    fireEvent.click(matBtn);

    // Nível 2: subject
    const subBtn = screen.getByRole('button', { name: /Sub1/ });
    fireEvent.click(subBtn);

    // Nível 3: data formatada deve aparecer
    expect(screen.getByText(/excelente/)).toBeInTheDocument();

    // Volta para nível 2 via ChevronLeft (back)
    const chevs = document.querySelectorAll('.lucide-chevron-left');
    const backBtn = chevs[0].closest('button')!;
    fireEvent.click(backBtn);

    // Volta para nível 1
    const chevs2 = document.querySelectorAll('.lucide-chevron-left');
    fireEvent.click(chevs2[0].closest('button')!);

    // Agora navega para Física e Sub2 (sem duração)
    fireEvent.click(screen.getByRole('button', { name: /Física/ }));
    fireEvent.click(screen.getByRole('button', { name: /Sub2/ }));

    // Fecha o painel via overlay (click no overlay)
    const overlay = document.querySelector('.fixed.inset-0.bg-navy\\/20')!;
    fireEvent.click(overlay);
  });

  it('panel mostra "Nenhuma revisão registrada" quando não há eventos', () => {
    render(<EspiaoEstrategico subjects={[]} reviewEvents={[]} />);
    fireEvent.click(screen.getByText(/Revisões Concluídas/));
    expect(screen.getByText(/Nenhuma revisão registrada/)).toBeInTheDocument();
  });

  it('clique no botão X fecha o painel', () => {
    render(<EspiaoEstrategico subjects={[]} reviewEvents={[]} />);
    fireEvent.click(screen.getByText(/Revisões Concluídas/));

    // botão X
    const xIcon = document.querySelector('.lucide-x');
    const xBtn = xIcon!.closest('button')!;
    fireEvent.click(xBtn);

    expect(screen.queryByText(/Nenhuma revisão registrada/)).not.toBeInTheDocument();
  });

  it('filtros de gráfico 6 meses usa buildMonthlyData', () => {
    const events: ReviewEventPayload[] = [
      {
        subjectId: 's1',
        subjectName: 'Sub1',
        reviewDate: createDate(40),
        performance: 'bom',
        reps: 1,
        questions: 5,
        accuracy: 80,
      },
    ];
    render(<EspiaoEstrategico subjects={[]} reviewEvents={events} />);
    fireEvent.click(screen.getByText('6 meses'));
    fireEvent.click(screen.getByText('Semanas'));
    fireEvent.click(screen.getByText('3 meses'));
  });

  it('getAccuracy: todas as performances cobertas via fallback', () => {
    const events: ReviewEventPayload[] = [
      {
        subjectId: 's1',
        subjectName: 'S1',
        reviewDate: createDate(2),
        performance: 'excelente',
        reps: 1,
        questions: 10,
        accuracy: 0,
      },
      {
        subjectId: 's2',
        subjectName: 'S2',
        reviewDate: createDate(2),
        performance: 'bom',
        reps: 1,
        questions: 10,
        accuracy: 0,
      },
      {
        subjectId: 's3',
        subjectName: 'S3',
        reviewDate: createDate(2),
        performance: 'medio',
        reps: 1,
        questions: 10,
        accuracy: 0,
      },
      {
        subjectId: 's4',
        subjectName: 'S4',
        reviewDate: createDate(2),
        performance: 'ruim',
        reps: 1,
        questions: 10,
        accuracy: 0,
      },
      {
        subjectId: 's5',
        subjectName: 'S5',
        reviewDate: createDate(2),
        performance: 'desconhecido' as any,
        reps: 1,
        questions: 10,
        accuracy: 0,
      },
    ];
    render(<EspiaoEstrategico subjects={[]} reviewEvents={events} />);
    expect(screen.getByText('Estatísticas')).toBeInTheDocument();
  });
});
