import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GerenciarConteudo } from '../../src/components/GerenciarConteudo';
import type { Subject } from '../../src/types';

const createAreaMock = vi.fn();
const createDisciplineMock = vi.fn();
const listTemplatesMock = vi.fn();

vi.mock('../../src/services/api', () => ({
  api: {
    subjectTemplates: {
      list: (...a: unknown[]) => listTemplatesMock(...a),
    },
    areas: {
      list: vi.fn().mockResolvedValue([
        { id: 10, name: 'Ciências da Natureza' },
        { id: 20, name: 'Matemática' },
      ]),
      create: (...a: unknown[]) => createAreaMock(...a),
      update: vi.fn(),
      delete: vi.fn(),
    },
    disciplines: {
      list: vi.fn().mockResolvedValue([
        { id: 101, areaId: 10, areaName: 'Ciências da Natureza', name: 'Biologia' },
        { id: 102, areaId: 10, areaName: 'Ciências da Natureza', name: 'Física' },
        { id: 201, areaId: 20, areaName: 'Matemática', name: 'Matemática' },
      ]),
      create: (...a: unknown[]) => createDisciplineMock(...a),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('GerenciarConteudo (cobertura extra)', () => {
  const onAdd = vi.fn();
  const onRemove = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    listTemplatesMock.mockResolvedValue([
      { id: 1, area: 'Cn', disciplina: 'Física', assunto: 'Leis', relevancia: 'Alta' },
    ]);
  });

  /** Navega até o select de assunto com área e disciplina Física selecionadas. */
  async function selecionarFisica() {
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ciências da Natureza' })).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByRole('combobox', { name: /área/i }), { target: { value: '10' } });
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /disciplina/i })).not.toBeDisabled();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /disciplina/i }), {
      target: { value: '102' },
    });
  }

  it('cancela criação de nova área via Cancelar', async () => {
    render(<GerenciarConteudo subjects={[]} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /\+ Nova área/i })).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByRole('combobox', { name: /área/i }), {
      target: { value: '__new__' },
    });
    await screen.findByLabelText(/Nome da nova área/i);
    fireEvent.click(screen.getByRole('button', { name: /^Cancelar$/i }));

    await waitFor(() =>
      expect(screen.queryByLabelText(/Nome da nova área/i)).not.toBeInTheDocument(),
    );
  });

  it('Enter cria nova área (cobre handler do onKeyDown)', async () => {
    createAreaMock.mockResolvedValue({ id: 99, name: 'NovaArea' });
    render(<GerenciarConteudo subjects={[]} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /\+ Nova área/i })).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByRole('combobox', { name: /área/i }), {
      target: { value: '__new__' },
    });
    const input = await screen.findByLabelText(/Nome da nova área/i);
    fireEvent.change(input, { target: { value: 'NovaArea' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(createAreaMock).toHaveBeenCalledWith('NovaArea'));
  });

  it('Escape cancela criação de nova área', async () => {
    render(<GerenciarConteudo subjects={[]} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /\+ Nova área/i })).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByRole('combobox', { name: /área/i }), {
      target: { value: '__new__' },
    });
    const input = await screen.findByLabelText(/Nome da nova área/i);
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByLabelText(/Nome da nova área/i)).not.toBeInTheDocument(),
    );
  });

  it('cria nova disciplina inline com Enter', async () => {
    createDisciplineMock.mockResolvedValue({
      id: 999,
      areaId: 10,
      areaName: 'Ciências da Natureza',
      name: 'NovaD',
    });
    render(<GerenciarConteudo subjects={[]} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ciências da Natureza' })).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByRole('combobox', { name: /área/i }), { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /disciplina/i })).not.toBeDisabled();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /disciplina/i }), {
      target: { value: '__new__' },
    });

    const dInput = await screen.findByLabelText(/Nome da nova disciplina/i);
    fireEvent.change(dInput, { target: { value: 'NovaD' } });
    fireEvent.keyDown(dInput, { key: 'Enter' });

    await waitFor(() => expect(createDisciplineMock).toHaveBeenCalledWith(10, 'NovaD'));
  });

  it('Escape cancela criação de nova disciplina', async () => {
    render(<GerenciarConteudo subjects={[]} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ciências da Natureza' })).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByRole('combobox', { name: /área/i }), { target: { value: '10' } });
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /disciplina/i })).not.toBeDisabled();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /disciplina/i }), {
      target: { value: '__new__' },
    });
    const dInput = await screen.findByLabelText(/Nome da nova disciplina/i);
    fireEvent.keyDown(dInput, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByLabelText(/Nome da nova disciplina/i)).not.toBeInTheDocument(),
    );
  });

  it('"Selecionar existente" volta do modo "novo assunto"', async () => {
    render(<GerenciarConteudo subjects={[]} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ciências da Natureza' })).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByRole('combobox', { name: /área/i }), { target: { value: '10' } });
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /disciplina/i })).not.toBeDisabled();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /disciplina/i }), {
      target: { value: '102' },
    });
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /assunto/i })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /assunto/i }), {
      target: { value: '__new__' },
    });
    expect(screen.getByPlaceholderText(/Ex: Funções Trigonométricas/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Selecionar existente/i }));
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /assunto/i })).toBeInTheDocument();
    });
  });

  it('submit com assunto vazio no modo "new" não chama onAdd', async () => {
    render(<GerenciarConteudo subjects={[]} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ciências da Natureza' })).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByRole('combobox', { name: /área/i }), { target: { value: '10' } });
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /disciplina/i })).not.toBeDisabled();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /disciplina/i }), {
      target: { value: '102' },
    });
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /assunto/i })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /assunto/i }), {
      target: { value: '__new__' },
    });
    // Não preenche o input do novo assunto

    fireEvent.click(screen.getByRole('button', { name: /REGISTRAR ESTUDO/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('seleciona template existente e submete com a relevancia do template', async () => {
    render(<GerenciarConteudo subjects={[]} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ciências da Natureza' })).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByRole('combobox', { name: /área/i }), { target: { value: '10' } });
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /disciplina/i })).not.toBeDisabled();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /disciplina/i }), {
      target: { value: '102' },
    });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Leis' })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /assunto/i }), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /REGISTRAR ESTUDO/i }));

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ aulaPrincipal: 'Leis', relevancia: 'Alta' }),
      ),
    );
  });

  it('submete a relevância "Média" do template selecionado', async () => {
    listTemplatesMock.mockResolvedValue([
      { id: 1, area: 'Cn', disciplina: 'Física', assunto: 'Leis', relevancia: 'Média' },
    ]);
    render(<GerenciarConteudo subjects={[]} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />);
    await selecionarFisica();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Leis' })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /assunto/i }), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /REGISTRAR ESTUDO/i }));

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ aulaPrincipal: 'Leis', relevancia: 'Média' }),
      ),
    );
  });

  it('normaliza relevância desconhecida do template para "Alta"', async () => {
    listTemplatesMock.mockResolvedValue([
      { id: 1, area: 'Cn', disciplina: 'Física', assunto: 'Leis', relevancia: 'Urgente' },
    ]);
    render(<GerenciarConteudo subjects={[]} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />);
    await selecionarFisica();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Leis' })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /assunto/i }), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /REGISTRAR ESTUDO/i }));

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ aulaPrincipal: 'Leis', relevancia: 'Alta' }),
      ),
    );
  });

  it('submete a relevância "Baixa" escolhida no modo "novo assunto"', async () => {
    render(<GerenciarConteudo subjects={[]} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />);
    await selecionarFisica();

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /assunto/i })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole('combobox', { name: /assunto/i }), {
      target: { value: '__new__' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Ex: Funções Trigonométricas/i), {
      target: { value: 'Termologia' },
    });
    // Select de relevância (sem label associado): localizado pelo valor default.
    fireEvent.change(screen.getByDisplayValue('Alta'), { target: { value: 'Baixa' } });

    fireEvent.click(screen.getByRole('button', { name: /REGISTRAR ESTUDO/i }));

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ aulaPrincipal: 'Termologia', relevancia: 'Baixa' }),
      ),
    );
  });
});
