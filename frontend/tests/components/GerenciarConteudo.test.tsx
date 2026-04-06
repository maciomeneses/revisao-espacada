import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GerenciarConteudo } from '../../src/components/GerenciarConteudo';
import type { Subject } from '../../src/types';
import { localDateStr } from '../../src/services/algorithm';

vi.mock('../../src/services/api', () => ({
  api: {
    subjectTemplates: {
      list: vi.fn().mockResolvedValue([
        { id: 1, area: 'Ciências da Natureza', disciplina: 'Física', assunto: 'Leis de Newton', relevancia: 'Alta' },
        { id: 2, area: 'Ciências da Natureza', disciplina: 'Física', assunto: 'Cinemática', relevancia: 'Alta' },
      ]),
    },
  },
}));

describe('GerenciarConteudo', () => {
  const onAddMock = vi.fn();
  const onRemoveMock = vi.fn();
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSubjects: Subject[] = [
    {
      id: 'sub-1', modulo: 'Física', area: 'Ciências da Natureza', aulaPrincipal: 'Biologia 101', relevancia: 'Alta',
      aulaAssistida: true, preAulaFeita: false, flashcardsFeitos: false, currentStage: 'Review',
      nextReviewDate: localDateStr(new Date()), lastReviewDate: null, lastPerformance: null, performanceLevel: 'nao_classificada',
    },
    {
      id: 'sub-2', modulo: 'Matemática', area: 'Matemática e suas Tecnologias', aulaPrincipal: 'Álgebra 101', relevancia: 'Alta',
      aulaAssistida: false, preAulaFeita: false, flashcardsFeitos: false, currentStage: 'New',
      nextReviewDate: null, lastReviewDate: null, lastPerformance: null, performanceLevel: 'nao_classificada',
    }
  ];

  it('renderiza corretamente o modal com a lista de assuntos atuais e os formulários de adição', () => {
    render(<GerenciarConteudo subjects={mockSubjects} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);

    expect(screen.getByText('Biologia 101')).toBeInTheDocument();
    expect(screen.getByText('Álgebra 101')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /REGISTRAR ESTUDO/i })).toBeInTheDocument();
  });

  it('permite preencher o form e adiciona novo assunto', async () => {
    render(<GerenciarConteudo subjects={mockSubjects} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);

    // Seleciona Área
    const areaSelect = screen.getByRole('combobox', { name: /área/i });
    fireEvent.change(areaSelect, { target: { value: 'Ciências da Natureza' } });

    // Seleciona Disciplina
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /disciplina/i })).not.toBeDisabled();
    });
    const disciplinaSelect = screen.getByRole('combobox', { name: /disciplina/i });
    fireEvent.change(disciplinaSelect, { target: { value: 'Física' } });

    // Aguarda os templates carregarem e seleciona "+ Novo assunto"
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /assunto/i })).toBeInTheDocument();
    });
    const assuntoSelect = screen.getByRole('combobox', { name: /assunto/i });
    fireEvent.change(assuntoSelect, { target: { value: '__new__' } });

    // Preenche o novo assunto
    const inputAssunto = screen.getByPlaceholderText(/Ex: Funções Trigonométricas/i);
    fireEvent.change(inputAssunto, { target: { value: 'Termologia' } });

    // Submete
    const saveBtn = screen.getByRole('button', { name: /REGISTRAR ESTUDO/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onAddMock).toHaveBeenCalledWith(expect.objectContaining({
        modulo: 'Física',
        area: 'Ciências da Natureza',
        aulaPrincipal: 'Termologia',
      }));
    });
  });

  it('auto-seleciona Matemática quando área é Matemática e suas Tecnologias', async () => {
    render(<GerenciarConteudo subjects={[]} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);

    const areaSelect = screen.getByRole('combobox', { name: /área/i });
    fireEvent.change(areaSelect, { target: { value: 'Matemática e suas Tecnologias' } });

    // O campo disciplina deve ser um input readonly com valor "Matemática"
    await waitFor(() => {
      const input = screen.getByDisplayValue('Matemática');
      expect(input).toBeInTheDocument();
    });
  });

  it('chama onRemove ao clicar na lixeira do assunto', () => {
    render(<GerenciarConteudo subjects={mockSubjects} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);

    const trashButtons = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('text-muted-light') && btn.className.includes('hover:text-red')
    );
    fireEvent.click(trashButtons[0]);

    expect(onRemoveMock).toHaveBeenCalledWith('sub-1');
  });

  it('chama onClose ao fechar', () => {
    render(<GerenciarConteudo subjects={mockSubjects} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);

    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]);
    expect(onCloseMock).toHaveBeenCalled();
  });
});
