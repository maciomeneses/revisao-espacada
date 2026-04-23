import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GerenciarCategorias } from '../../src/pages/GerenciarCategorias';
import type { Subject } from '../../src/types';

const listAreasMock = vi.fn();
const listDisciplinesMock = vi.fn();
const createAreaMock = vi.fn();
const updateAreaMock = vi.fn();
const deleteAreaMock = vi.fn();
const createDisciplineMock = vi.fn();
const updateDisciplineMock = vi.fn();
const deleteDisciplineMock = vi.fn();

vi.mock('../../src/services/api', () => ({
  api: {
    areas: {
      list: (...a: unknown[]) => listAreasMock(...a),
      create: (...a: unknown[]) => createAreaMock(...a),
      update: (...a: unknown[]) => updateAreaMock(...a),
      delete: (...a: unknown[]) => deleteAreaMock(...a),
    },
    disciplines: {
      list: (...a: unknown[]) => listDisciplinesMock(...a),
      create: (...a: unknown[]) => createDisciplineMock(...a),
      update: (...a: unknown[]) => updateDisciplineMock(...a),
      delete: (...a: unknown[]) => deleteDisciplineMock(...a),
    },
  },
}));

function makeSubject(area: string, modulo: string, id: string): Subject {
  return {
    id, modulo, area, aulaPrincipal: `Aula ${id}`, relevancia: 'Alta',
    aulaAssistida: false, preAulaFeita: false, flashcardsFeitos: false,
    currentStage: 'aula', nextReviewDate: null, lastReviewDate: null,
    lastPerformance: null, performanceLevel: 'nao_classificada',
  };
}

describe('GerenciarCategorias', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    listAreasMock.mockResolvedValue([
      { id: 1, name: 'Ciências da Natureza' },
      { id: 2, name: 'Redação' },
    ]);
    listDisciplinesMock.mockResolvedValue([
      { id: 10, areaId: 1, areaName: 'Ciências da Natureza', name: 'Biologia' },
      { id: 11, areaId: 1, areaName: 'Ciências da Natureza', name: 'Física' },
    ]);
  });

  it('renderiza lista de áreas com suas disciplinas', async () => {
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Ciências da Natureza' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Redação' })).toBeInTheDocument();
      expect(screen.getByText('Biologia')).toBeInTheDocument();
      expect(screen.getByText('Física')).toBeInTheDocument();
    });
  });

  it('cria nova área via formulário', async () => {
    createAreaMock.mockResolvedValue({ id: 99, name: 'Humanas' });
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() => expect(screen.getByLabelText(/Nome da nova área/i)).toBeInTheDocument());

    const input = screen.getByLabelText(/Nome da nova área/i);
    fireEvent.change(input, { target: { value: 'Humanas' } });
    // O primeiro botão "Adicionar" pertence ao formulário de nova área.
    fireEvent.click(screen.getAllByRole('button', { name: /Adicionar/i })[0]);

    await waitFor(() => expect(createAreaMock).toHaveBeenCalledWith('Humanas'));
  });

  it('cria nova disciplina dentro de uma área selecionada', async () => {
    createDisciplineMock.mockResolvedValue({
      id: 50, areaId: 1, areaName: 'Ciências da Natureza', name: 'Química',
    });
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() => expect(screen.getByLabelText(/Área da nova disciplina/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Área da nova disciplina/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Nome da nova disciplina/i), { target: { value: 'Química' } });

    const buttons = screen.getAllByRole('button', { name: /Adicionar/i });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(createDisciplineMock).toHaveBeenCalledWith(1, 'Química'));
  });

  it('exclusão de área exibe modal com contagem de disciplinas e assuntos', async () => {
    deleteAreaMock.mockResolvedValue(undefined);
    const subjects = [
      makeSubject('Ciências da Natureza', 'Biologia', 's1'),
      makeSubject('Ciências da Natureza', 'Física', 's2'),
    ];
    render(<GerenciarCategorias subjects={subjects} />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Ciências da Natureza' })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByLabelText(/Excluir área Ciências da Natureza/i));

    await waitFor(() => expect(screen.getByText(/Confirmar exclusão/i)).toBeInTheDocument());
    // O texto de confirmação é fragmentado entre nós de texto e <strong>; usa matcher de elemento.
    expect(screen.getByText(/disciplina\(s\) e/i)).toBeInTheDocument();
    expect(screen.getByText(/assunto\(s\)\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Excluir$/i }));
    await waitFor(() => expect(deleteAreaMock).toHaveBeenCalledWith(1));
  });

  it('renomeia disciplina inline', async () => {
    updateDisciplineMock.mockResolvedValue({ id: 10, areaId: 1, name: 'Bio' });
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() => expect(screen.getByText('Biologia')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/Renomear disciplina Biologia/i));
    const input = await screen.findByLabelText(/Editar nome da disciplina/i);
    fireEvent.change(input, { target: { value: 'Bio' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));

    await waitFor(() => expect(updateDisciplineMock).toHaveBeenCalledWith(10, 'Bio'));
  });
});
