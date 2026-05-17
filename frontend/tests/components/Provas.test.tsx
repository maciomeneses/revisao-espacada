import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provas } from '../../src/components/Provas';
import { api } from '../../src/services/api';
import type { ExamEntryPayload } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  api: {
    examEntries: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockedApi = api as unknown as {
  examEntries: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

function makeEntry(overrides: Partial<ExamEntryPayload> = {}): ExamEntryPayload {
  return {
    id: 1,
    examDate: '2026-05-10',
    examName: 'ENEM 2025 — Caderno Azul',
    examType: 'Prova na íntegra',
    scorePercent: 80,
    notes: 'Notas iniciais',
    ...overrides,
  };
}

describe('Provas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.examEntries.list.mockResolvedValue([]);
    mockedApi.examEntries.create.mockResolvedValue(makeEntry());
    mockedApi.examEntries.update.mockResolvedValue(makeEntry());
    mockedApi.examEntries.delete.mockResolvedValue(undefined);
  });

  it('exibe estado de carregamento inicial', () => {
    mockedApi.examEntries.list.mockReturnValue(new Promise(() => {}));
    render(<Provas />);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('renderiza mensagem de lista vazia após carregar', async () => {
    render(<Provas />);
    await waitFor(() => expect(screen.getByText(/nenhuma prova registrada/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /registrar primeira prova/i })).toBeInTheDocument();
  });

  it('renderiza itens retornados de api.examEntries.list', async () => {
    mockedApi.examEntries.list.mockResolvedValue([
      makeEntry({ id: 1, examName: 'Prova A', scorePercent: 90 }),
      makeEntry({ id: 2, examName: 'Prova B', scorePercent: 50 }),
    ]);
    render(<Provas />);
    await waitFor(() => expect(screen.getByText('Prova A')).toBeInTheDocument());
    expect(screen.getByText('Prova B')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    // Score labels
    expect(screen.getAllByText(/excelente/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/insuficiente/i).length).toBeGreaterThan(0);
  });

  it('renderiza labels de score corretos para cada faixa', async () => {
    mockedApi.examEntries.list.mockResolvedValue([
      makeEntry({ id: 1, scorePercent: 85, examName: 'X1' }),
      makeEntry({ id: 2, scorePercent: 70, examName: 'X2' }),
      makeEntry({ id: 3, scorePercent: 60, examName: 'X3' }),
      makeEntry({ id: 4, scorePercent: 30, examName: 'X4' }),
    ]);
    render(<Provas />);
    await waitFor(() => expect(screen.getByText('X1')).toBeInTheDocument());
    expect(screen.getByText('Excelente')).toBeInTheDocument();
    expect(screen.getByText('Suficiente')).toBeInTheDocument();
    expect(screen.getByText('Regular')).toBeInTheDocument();
    expect(screen.getByText('Insuficiente')).toBeInTheDocument();
  });

  it('lida com erro ao listar (console.error) e exibe lista vazia', async () => {
    const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedApi.examEntries.list.mockRejectedValue(new Error('Rede caiu'));
    render(<Provas />);
    await waitFor(() => expect(screen.getByText(/nenhuma prova registrada/i)).toBeInTheDocument());
    expect(consoleErr).toHaveBeenCalled();
    consoleErr.mockRestore();
  });

  it('abre modal de nova prova ao clicar em Nova Prova', async () => {
    render(<Provas />);
    await waitFor(() => screen.getByText(/nenhuma prova registrada/i));
    fireEvent.click(screen.getByRole('button', { name: /^nova prova$/i }));
    expect(screen.getByRole('heading', { name: /nova prova/i })).toBeInTheDocument();
  });

  it('abre modal pelo botão "Registrar primeira prova"', async () => {
    render(<Provas />);
    await waitFor(() => screen.getByText(/nenhuma prova registrada/i));
    fireEvent.click(screen.getByRole('button', { name: /registrar primeira prova/i }));
    expect(screen.getByRole('heading', { name: /nova prova/i })).toBeInTheDocument();
  });

  it('valida nome em branco ao salvar', async () => {
    render(<Provas />);
    await waitFor(() => screen.getByText(/nenhuma prova registrada/i));
    fireEvent.click(screen.getByRole('button', { name: /^nova prova$/i }));

    // Preencher score válido, deixar examName vazio
    const scoreInput = screen.getByPlaceholderText('0–100');
    fireEvent.change(scoreInput, { target: { value: '80' } });

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));
    expect(await screen.findByText(/informe o nome da prova/i)).toBeInTheDocument();
    expect(mockedApi.examEntries.create).not.toHaveBeenCalled();
  });

  it('valida data vazia ao salvar', async () => {
    render(<Provas />);
    await waitFor(() => screen.getByText(/nenhuma prova registrada/i));
    fireEvent.click(screen.getByRole('button', { name: /^nova prova$/i }));

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));
    expect(await screen.findByText(/informe a data/i)).toBeInTheDocument();
    expect(mockedApi.examEntries.create).not.toHaveBeenCalled();
  });

  it('valida scorePercent fora do intervalo 0-100', async () => {
    render(<Provas />);
    await waitFor(() => screen.getByText(/nenhuma prova registrada/i));
    fireEvent.click(screen.getByRole('button', { name: /^nova prova$/i }));

    const nameInput = screen.getByPlaceholderText(/ENEM 2025/i);
    fireEvent.change(nameInput, { target: { value: 'Teste' } });
    const scoreInput = screen.getByPlaceholderText('0–100');
    fireEvent.change(scoreInput, { target: { value: '150' } });

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));
    expect(await screen.findByText(/% de acerto deve ser entre 0 e 100/i)).toBeInTheDocument();
    expect(mockedApi.examEntries.create).not.toHaveBeenCalled();
  });

  it('valida scorePercent negativo', async () => {
    render(<Provas />);
    await waitFor(() => screen.getByText(/nenhuma prova registrada/i));
    fireEvent.click(screen.getByRole('button', { name: /^nova prova$/i }));

    const nameInput = screen.getByPlaceholderText(/ENEM 2025/i);
    fireEvent.change(nameInput, { target: { value: 'Teste' } });
    fireEvent.change(screen.getByPlaceholderText('0–100'), { target: { value: '-5' } });

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));
    expect(await screen.findByText(/% de acerto deve ser entre 0 e 100/i)).toBeInTheDocument();
  });

  it('cria nova entrada e atualiza lista', async () => {
    const created = makeEntry({ id: 42, examName: 'Nova', scorePercent: 75 });
    mockedApi.examEntries.create.mockResolvedValue(created);

    render(<Provas />);
    await waitFor(() => screen.getByText(/nenhuma prova registrada/i));
    fireEvent.click(screen.getByRole('button', { name: /^nova prova$/i }));

    fireEvent.change(screen.getByPlaceholderText(/ENEM 2025/i), { target: { value: 'Nova' } });
    fireEvent.change(screen.getByPlaceholderText('0–100'), { target: { value: '75' } });

    // Alterar select de tipo
    const select = document.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Simulado' } });

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));

    await waitFor(() => expect(mockedApi.examEntries.create).toHaveBeenCalledOnce());
    expect(mockedApi.examEntries.create).toHaveBeenCalledWith(expect.objectContaining({
      examName: 'Nova',
      scorePercent: 75,
      examType: 'Simulado',
    }));
    await waitFor(() => expect(screen.getByText('Nova')).toBeInTheDocument());
  });

  it('mostra erro quando create falha e mantém modal aberto', async () => {
    mockedApi.examEntries.create.mockRejectedValue(new Error('Falha na rede'));

    render(<Provas />);
    await waitFor(() => screen.getByText(/nenhuma prova registrada/i));
    fireEvent.click(screen.getByRole('button', { name: /^nova prova$/i }));

    fireEvent.change(screen.getByPlaceholderText(/ENEM 2025/i), { target: { value: 'X' } });
    fireEvent.change(screen.getByPlaceholderText('0–100'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));

    expect(await screen.findByText(/falha na rede/i)).toBeInTheDocument();
    // Modal ainda aberto
    expect(screen.getByRole('heading', { name: /nova prova/i })).toBeInTheDocument();
  });

  it('mostra erro genérico quando create rejeita com não-Error', async () => {
    mockedApi.examEntries.create.mockRejectedValue('string err');

    render(<Provas />);
    await waitFor(() => screen.getByText(/nenhuma prova registrada/i));
    fireEvent.click(screen.getByRole('button', { name: /^nova prova$/i }));

    fireEvent.change(screen.getByPlaceholderText(/ENEM 2025/i), { target: { value: 'X' } });
    fireEvent.change(screen.getByPlaceholderText('0–100'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));

    expect(await screen.findByText(/erro ao salvar/i)).toBeInTheDocument();
  });

  it('cancela modal sem submeter', async () => {
    render(<Provas />);
    await waitFor(() => screen.getByText(/nenhuma prova registrada/i));
    fireEvent.click(screen.getByRole('button', { name: /^nova prova$/i }));

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByRole('heading', { name: /nova prova/i })).not.toBeInTheDocument();
    expect(mockedApi.examEntries.create).not.toHaveBeenCalled();
  });

  it('abre painel de detalhes ao clicar em uma linha', async () => {
    mockedApi.examEntries.list.mockResolvedValue([makeEntry({ id: 1, examName: 'Prova Detalhe' })]);
    render(<Provas />);
    await waitFor(() => screen.getByText('Prova Detalhe'));

    fireEvent.click(screen.getByText('Prova Detalhe'));
    expect(screen.getByText(/aproveitamento/i)).toBeInTheDocument();
    expect(screen.getByText(/caderno de erros/i)).toBeInTheDocument();
  });

  it('fecha painel de detalhes ao clicar no X', async () => {
    mockedApi.examEntries.list.mockResolvedValue([makeEntry({ id: 1, examName: 'P' })]);
    render(<Provas />);
    await waitFor(() => screen.getByText('P'));
    fireEvent.click(screen.getByText('P'));

    const closeBtn = document.querySelector('button > svg.lucide-x')?.closest('button') as HTMLElement;
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/aproveitamento/i)).not.toBeInTheDocument();
  });

  it('edita entrada existente via botão Editar do painel', async () => {
    const entry = makeEntry({ id: 7, examName: 'Original', scorePercent: 60 });
    const updated = { ...entry, examName: 'Editada', scorePercent: 90 };
    mockedApi.examEntries.list.mockResolvedValue([entry]);
    mockedApi.examEntries.update.mockResolvedValue(updated);

    render(<Provas />);
    await waitFor(() => screen.getByText('Original'));
    fireEvent.click(screen.getByText('Original'));
    fireEvent.click(screen.getByRole('button', { name: /^editar$/i }));

    expect(screen.getByRole('heading', { name: /editar prova/i })).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/ENEM 2025/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Editada' } });
    const scoreInput = screen.getByPlaceholderText('0–100') as HTMLInputElement;
    fireEvent.change(scoreInput, { target: { value: '90' } });

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));

    await waitFor(() => expect(mockedApi.examEntries.update).toHaveBeenCalledWith(7, expect.objectContaining({
      examName: 'Editada',
      scorePercent: 90,
    })));
    await waitFor(() => expect(screen.getAllByText('Editada').length).toBeGreaterThan(0));
  });

  it('edita entrada sem examType (usa fallback) e notes vazio', async () => {
    const entry = makeEntry({ id: 9, examType: undefined, notes: undefined });
    mockedApi.examEntries.list.mockResolvedValue([entry]);
    mockedApi.examEntries.update.mockResolvedValue(entry);

    render(<Provas />);
    await waitFor(() => screen.getByText(entry.examName));
    fireEvent.click(screen.getByText(entry.examName));
    fireEvent.click(screen.getByRole('button', { name: /^editar$/i }));

    const select = document.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('Prova na íntegra');

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() => expect(mockedApi.examEntries.update).toHaveBeenCalled());
  });

  it('deleta entrada via botão Excluir do painel', async () => {
    const entry = makeEntry({ id: 5, examName: 'Para Excluir' });
    mockedApi.examEntries.list.mockResolvedValue([entry]);

    render(<Provas />);
    await waitFor(() => screen.getByText('Para Excluir'));
    fireEvent.click(screen.getByText('Para Excluir'));
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }));

    await waitFor(() => expect(mockedApi.examEntries.delete).toHaveBeenCalledWith(5));
    await waitFor(() => expect(screen.queryByText('Para Excluir')).not.toBeInTheDocument());
  });

  it('lida com erro no delete (console.error) mas remove do estado', async () => {
    const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const entry = makeEntry({ id: 5, examName: 'Falha Delete' });
    mockedApi.examEntries.list.mockResolvedValue([entry]);
    mockedApi.examEntries.delete.mockRejectedValue(new Error('boom'));

    render(<Provas />);
    await waitFor(() => screen.getByText('Falha Delete'));
    fireEvent.click(screen.getByText('Falha Delete'));
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }));

    await waitFor(() => expect(consoleErr).toHaveBeenCalled());
    consoleErr.mockRestore();
  });

  it('salva notas (Caderno de Erros) via botão Salvar Notas', async () => {
    const entry = makeEntry({ id: 3, notes: 'antigo' });
    const updated = { ...entry, notes: 'novo conteúdo' };
    mockedApi.examEntries.list.mockResolvedValue([entry]);
    mockedApi.examEntries.update.mockResolvedValue(updated);

    render(<Provas />);
    await waitFor(() => screen.getByText(entry.examName));
    fireEvent.click(screen.getByText(entry.examName));

    const textarea = screen.getByPlaceholderText(/anote aqui/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'novo conteúdo' } });

    fireEvent.click(screen.getByRole('button', { name: /salvar notas/i }));
    await waitFor(() => expect(mockedApi.examEntries.update).toHaveBeenCalledWith(3, expect.objectContaining({
      notes: 'novo conteúdo',
    })));
  });

  it('exibe erro ao falhar saveNotes', async () => {
    const entry = makeEntry({ id: 4, notes: '' });
    mockedApi.examEntries.list.mockResolvedValue([entry]);
    mockedApi.examEntries.update.mockRejectedValue(new Error('falhou notas'));

    render(<Provas />);
    await waitFor(() => screen.getByText(entry.examName));
    fireEvent.click(screen.getByText(entry.examName));

    const textarea = screen.getByPlaceholderText(/anote aqui/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'algo' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar notas/i }));

    expect(await screen.findByText(/falhou notas/i)).toBeInTheDocument();
  });

  it('exibe erro genérico ao falhar saveNotes com não-Error', async () => {
    const entry = makeEntry({ id: 4, notes: '' });
    mockedApi.examEntries.list.mockResolvedValue([entry]);
    mockedApi.examEntries.update.mockRejectedValue('x');

    render(<Provas />);
    await waitFor(() => screen.getByText(entry.examName));
    fireEvent.click(screen.getByText(entry.examName));

    fireEvent.change(screen.getByPlaceholderText(/anote aqui/i), { target: { value: 'algo' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar notas/i }));

    expect(await screen.findByText(/erro ao salvar notas/i)).toBeInTheDocument();
  });

  it('botão Salvar Notas fica desabilitado quando texto inalterado', async () => {
    const entry = makeEntry({ id: 1, notes: 'mesmo' });
    mockedApi.examEntries.list.mockResolvedValue([entry]);

    render(<Provas />);
    await waitFor(() => screen.getByText(entry.examName));
    fireEvent.click(screen.getByText(entry.examName));

    const btn = screen.getByRole('button', { name: /salvar notas/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('atualiza selectedEntry quando edita a entrada selecionada', async () => {
    const entry = makeEntry({ id: 11, examName: 'Sel', scorePercent: 50 });
    const updated = { ...entry, examName: 'Sel Editada', scorePercent: 95 };
    mockedApi.examEntries.list.mockResolvedValue([entry]);
    mockedApi.examEntries.update.mockResolvedValue(updated);

    render(<Provas />);
    await waitFor(() => screen.getByText('Sel'));
    fireEvent.click(screen.getByText('Sel'));
    fireEvent.click(screen.getByRole('button', { name: /^editar$/i }));

    fireEvent.change(screen.getByPlaceholderText(/ENEM 2025/i), { target: { value: 'Sel Editada' } });
    fireEvent.change(screen.getByPlaceholderText('0–100'), { target: { value: '95' } });
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));

    // Painel mostra novo score (aparece na linha + painel)
    await waitFor(() => expect(screen.getAllByText('95%').length).toBeGreaterThan(0));
  });

  it('deletar a entrada selecionada fecha o painel', async () => {
    const entry = makeEntry({ id: 22, examName: 'Selecionada' });
    mockedApi.examEntries.list.mockResolvedValue([entry]);

    render(<Provas />);
    await waitFor(() => screen.getByText('Selecionada'));
    fireEvent.click(screen.getByText('Selecionada'));
    expect(screen.getByText(/aproveitamento/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /excluir/i }));
    await waitFor(() => expect(screen.queryByText(/aproveitamento/i)).not.toBeInTheDocument());
  });
});
