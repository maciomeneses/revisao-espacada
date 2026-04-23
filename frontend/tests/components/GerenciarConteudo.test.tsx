import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GerenciarConteudo } from '../../src/components/GerenciarConteudo';
import type { Subject } from '../../src/types';
import { localDateStr } from '../../src/services/algorithm';

const listAreasMock = vi.fn();
const listDisciplinesMock = vi.fn();
const createAreaMock = vi.fn();
const createDisciplineMock = vi.fn();

vi.mock('../../src/services/api', () => ({
  api: {
    subjectTemplates: {
      list: vi.fn().mockResolvedValue([
        { id: 1, area: 'Ciências da Natureza', disciplina: 'Física', assunto: 'Leis de Newton', relevancia: 'Alta' },
        { id: 2, area: 'Ciências da Natureza', disciplina: 'Física', assunto: 'Cinemática', relevancia: 'Alta' },
      ]),
    },
    areas: {
      list: (...args: unknown[]) => listAreasMock(...args),
      create: (...args: unknown[]) => createAreaMock(...args),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    disciplines: {
      list: (...args: unknown[]) => listDisciplinesMock(...args),
      create: (...args: unknown[]) => createDisciplineMock(...args),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

describe('GerenciarConteudo', () => {
  const onAddMock = vi.fn();
  const onRemoveMock = vi.fn();
  const onCloseMock = vi.fn();

  const baseAreas = [
    { id: 10, name: 'Ciências da Natureza' },
    { id: 20, name: 'Matemática e suas Tecnologias' },
  ];

  const baseDisciplines = [
    { id: 101, areaId: 10, areaName: 'Ciências da Natureza', name: 'Biologia' },
    { id: 102, areaId: 10, areaName: 'Ciências da Natureza', name: 'Física' },
    { id: 103, areaId: 10, areaName: 'Ciências da Natureza', name: 'Química' },
    { id: 201, areaId: 20, areaName: 'Matemática e suas Tecnologias', name: 'Matemática' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    listAreasMock.mockResolvedValue(baseAreas);
    listDisciplinesMock.mockResolvedValue(baseDisciplines);
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
    },
  ];

  it('renderiza corretamente o modal com a lista de assuntos atuais e os formulários de adição', () => {
    render(<GerenciarConteudo subjects={mockSubjects} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);

    expect(screen.getByText('Biologia 101')).toBeInTheDocument();
    expect(screen.getByText('Álgebra 101')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /REGISTRAR ESTUDO/i })).toBeInTheDocument();
  });

  it('permite preencher o form e adiciona novo assunto', async () => {
    render(<GerenciarConteudo subjects={mockSubjects} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);

    // Aguarda carregamento do catálogo.
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Ciências da Natureza' })).toBeInTheDocument();
    });

    // Seleciona área (value é o id da Area).
    const areaSelect = screen.getByRole('combobox', { name: /área/i });
    fireEvent.change(areaSelect, { target: { value: '10' } });

    // Seleciona disciplina.
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /disciplina/i })).not.toBeDisabled();
    });
    const disciplinaSelect = screen.getByRole('combobox', { name: /disciplina/i });
    fireEvent.change(disciplinaSelect, { target: { value: '102' } });

    // Aguarda os templates carregarem e seleciona "+ Novo assunto".
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /assunto/i })).toBeInTheDocument();
    });
    const assuntoSelect = screen.getByRole('combobox', { name: /assunto/i });
    fireEvent.change(assuntoSelect, { target: { value: '__new__' } });

    // Preenche o novo assunto.
    const inputAssunto = screen.getByPlaceholderText(/Ex: Funções Trigonométricas/i);
    fireEvent.change(inputAssunto, { target: { value: 'Termologia' } });

    // Submete.
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

  it('auto-seleciona a única disciplina quando a área tem apenas uma', async () => {
    render(<GerenciarConteudo subjects={[]} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Matemática e suas Tecnologias' })).toBeInTheDocument();
    });

    const areaSelect = screen.getByRole('combobox', { name: /área/i });
    fireEvent.change(areaSelect, { target: { value: '20' } });

    // A disciplina única (Matemática) deve ser pré-selecionada.
    await waitFor(() => {
      const disciplinaSelect = screen.getByRole('combobox', { name: /disciplina/i }) as HTMLSelectElement;
      expect(disciplinaSelect.value).toBe('201');
    });
  });

  it('permite criar uma nova área inline e seleciona-a automaticamente', async () => {
    createAreaMock.mockResolvedValue({ id: 99, name: 'Redação' });
    render(<GerenciarConteudo subjects={[]} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /\+ Nova área/i })).toBeInTheDocument();
    });

    const areaSelect = screen.getByRole('combobox', { name: /área/i });
    fireEvent.change(areaSelect, { target: { value: '__new__' } });

    const input = await screen.findByLabelText(/Nome da nova área/i);
    fireEvent.change(input, { target: { value: 'Redação' } });
    fireEvent.click(screen.getByRole('button', { name: /criar/i }));

    await waitFor(() => {
      expect(createAreaMock).toHaveBeenCalledWith('Redação');
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
