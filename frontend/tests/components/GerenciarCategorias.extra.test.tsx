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
    id,
    modulo,
    area,
    aulaPrincipal: `Aula ${id}`,
    relevancia: 'Alta',
    aulaAssistida: false,
    preAulaFeita: false,
    flashcardsFeitos: false,
    currentStage: 'aula',
    nextReviewDate: null,
    lastReviewDate: null,
    lastPerformance: null,
    performanceLevel: 'nao_classificada',
  };
}

describe('GerenciarCategorias (cobertura extra)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    listAreasMock.mockResolvedValue([{ id: 1, name: 'Área 1' }]);
    listDisciplinesMock.mockResolvedValue([{ id: 10, areaId: 1, areaName: 'Área 1', name: 'D1' }]);
  });

  it('exibe estado de loading e depois lista', async () => {
    let resolve!: (v: any) => void;
    listAreasMock.mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    listDisciplinesMock.mockResolvedValue([]);
    render(<GerenciarCategorias subjects={[]} />);
    expect(screen.getByText(/Carregando.../)).toBeInTheDocument();
    resolve([]);
    await waitFor(() => {
      expect(screen.queryByText(/Carregando.../)).not.toBeInTheDocument();
    });
  });

  it('estado vazio: "Nenhuma área cadastrada"', async () => {
    listAreasMock.mockResolvedValueOnce([]);
    listDisciplinesMock.mockResolvedValueOnce([]);
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() => {
      expect(screen.getByText(/Nenhuma área cadastrada/i)).toBeInTheDocument();
    });
  });

  it('"Sem disciplinas" exibido para área sem disciplinas', async () => {
    listAreasMock.mockResolvedValueOnce([{ id: 99, name: 'Vazia' }]);
    listDisciplinesMock.mockResolvedValueOnce([]);
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() => {
      expect(screen.getByText(/Sem disciplinas/i)).toBeInTheDocument();
    });
  });

  it('handleCreateArea ignora nome vazio (trim)', async () => {
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() => expect(screen.getByLabelText(/Nome da nova área/i)).toBeInTheDocument());

    const input = screen.getByLabelText(/Nome da nova área/i);
    fireEvent.change(input, { target: { value: '   ' } });
    // Submete o form via teclar Enter pra evitar o disabled
    fireEvent.submit(input.closest('form')!);

    expect(createAreaMock).not.toHaveBeenCalled();
  });

  it('handleCreateDiscipline ignora quando areaId vazio', async () => {
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() =>
      expect(screen.getByLabelText(/Área da nova disciplina/i)).toBeInTheDocument(),
    );

    const form = screen.getByLabelText(/Área da nova disciplina/i).closest('form')!;
    fireEvent.submit(form);
    expect(createDisciplineMock).not.toHaveBeenCalled();
  });

  it('exclusão de disciplina exibe contagem de subjects vinculados', async () => {
    deleteDisciplineMock.mockResolvedValue(undefined);
    render(<GerenciarCategorias subjects={[makeSubject('Área 1', 'D1', 's1')]} />);
    await waitFor(() => expect(screen.getByText('D1')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/Excluir disciplina D1/i));

    await waitFor(() => {
      expect(screen.getByText(/Confirmar exclusão/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/assunto\(s\) vinculado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Excluir$/i }));
    await waitFor(() => expect(deleteDisciplineMock).toHaveBeenCalledWith(10));
  });

  it('cancelar modal de confirmação fecha sem deletar', async () => {
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() => expect(screen.getByText('D1')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/Excluir disciplina D1/i));
    await waitFor(() => screen.getByText(/Confirmar exclusão/));

    fireEvent.click(screen.getByRole('button', { name: /^Cancelar$/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Confirmar exclusão/)).not.toBeInTheDocument();
    });
    expect(deleteDisciplineMock).not.toHaveBeenCalled();
  });

  it('renomear área inline com Enter', async () => {
    updateAreaMock.mockResolvedValue({ id: 1, name: 'Área Editada' });
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Área 1' })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByLabelText(/Renomear área Área 1/i));
    const input = await screen.findByLabelText(/Editar nome da área/i);
    fireEvent.change(input, { target: { value: 'Área Editada' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(updateAreaMock).toHaveBeenCalledWith(1, 'Área Editada'));
  });

  it('Escape cancela renomear área inline', async () => {
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Área 1' })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByLabelText(/Renomear área Área 1/i));
    const input = await screen.findByLabelText(/Editar nome da área/i);
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByLabelText(/Editar nome da área/i)).not.toBeInTheDocument();
    });
  });

  it('Cancelar renomear disciplina via botão', async () => {
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() => expect(screen.getByText('D1')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/Renomear disciplina D1/i));
    await screen.findByLabelText(/Editar nome da disciplina/i);
    fireEvent.click(screen.getByRole('button', { name: /^Cancelar$/i }));

    await waitFor(() => {
      expect(screen.queryByLabelText(/Editar nome da disciplina/i)).not.toBeInTheDocument();
    });
  });

  it('Escape cancela renomear disciplina', async () => {
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() => expect(screen.getByText('D1')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/Renomear disciplina D1/i));
    const input = await screen.findByLabelText(/Editar nome da disciplina/i);
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByLabelText(/Editar nome da disciplina/i)).not.toBeInTheDocument();
    });
  });

  it('saveRename ignora draft vazio', async () => {
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Área 1' })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByLabelText(/Renomear área Área 1/i));
    const input = await screen.findByLabelText(/Editar nome da área/i);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));

    expect(updateAreaMock).not.toHaveBeenCalled();
  });

  it('createDiscipline sucesso limpa o campo name (mantém areaId)', async () => {
    createDisciplineMock.mockResolvedValue({
      id: 999,
      areaId: 1,
      areaName: 'Área 1',
      name: 'NovaDisc',
    });
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() =>
      expect(screen.getByLabelText(/Área da nova disciplina/i)).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText(/Área da nova disciplina/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Nome da nova disciplina/i), {
      target: { value: 'NovaDisc' },
    });

    const buttons = screen.getAllByRole('button', { name: /Adicionar/i });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(createDisciplineMock).toHaveBeenCalledWith(1, 'NovaDisc'));
    await waitFor(() => {
      expect((screen.getByLabelText(/Nome da nova disciplina/i) as HTMLInputElement).value).toBe(
        '',
      );
    });
  });

  it('countSubjectsForDiscipline com areaName ausente cai para fallback de areas.find', async () => {
    // Disciplina sem areaName forçando fallback `areas.find((a) => a.id === d.areaId)?.name`
    listDisciplinesMock.mockResolvedValueOnce([{ id: 10, areaId: 1, name: 'D-NoAreaName' } as any]);
    render(
      <GerenciarCategorias
        subjects={[{ id: 's1', area: 'Área 1', modulo: 'D-NoAreaName' } as any]}
      />,
    );
    await waitFor(() => expect(screen.getByText('D-NoAreaName')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/Excluir disciplina D-NoAreaName/i));
    await waitFor(() => {
      expect(screen.getByText(/Confirmar exclusão/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/assunto\(s\) vinculado/i)).toBeInTheDocument();
  });

  it('exibe banner de erro do hook e permite fechá-lo', async () => {
    createAreaMock.mockRejectedValueOnce(new Error('Já existe'));
    render(<GerenciarCategorias subjects={[]} />);
    await waitFor(() => expect(screen.getByLabelText(/Nome da nova área/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Nome da nova área/i), { target: { value: 'X' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Adicionar/i })[0]);

    await waitFor(() => expect(screen.getByText(/Já existe/i)).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/Fechar erro/i));
    await waitFor(() => {
      expect(screen.queryByText(/Já existe/i)).not.toBeInTheDocument();
    });
  });
});
