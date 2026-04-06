import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GerenciarConteudo } from '../../src/components/GerenciarConteudo';
import type { Subject } from '../../src/types';
import { localDateStr } from '../../src/services/algorithm';

describe('GerenciarConteudo', () => {
  const onAddMock = vi.fn();
  const onRemoveMock = vi.fn();
  const onCloseMock = vi.fn();

  const mockSubjects: Subject[] = [
    {
      id: 'sub-1', modulo: 'Módulo 1', area: 'Ciências', aulaPrincipal: 'Biologia 101', relevancia: 'Alta',
      aulaAssistida: true, preAulaFeita: false, flashcardsFeitos: false, currentStage: 'Review',
      nextReviewDate: localDateStr(new Date()), lastReviewDate: null, lastPerformance: null, performanceLevel: 'nao_classificada',
    },
    {
      id: 'sub-2', modulo: 'Módulo 1', area: 'Matemática', aulaPrincipal: 'Álgebra 101', relevancia: 'Alta',
      aulaAssistida: false, preAulaFeita: false, flashcardsFeitos: false, currentStage: 'New',
      nextReviewDate: null, lastReviewDate: null, lastPerformance: null, performanceLevel: 'nao_classificada',
    }
  ];

  it('renderiza corretamente o modal com a lista de assuntos atuais e os formulários de adição', () => {
    render(<GerenciarConteudo subjects={mockSubjects} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);

    expect(screen.getByText('Biologia 101')).toBeInTheDocument();
    expect(screen.getByText('Álgebra 101')).toBeInTheDocument();
    
    // Testa botão de adicionar ao cronograma
    expect(screen.getByRole('button', { name: /REGISTRAR ESTUDO/i })).toBeInTheDocument();
  });

  it('permite preencher o form e adiciona novo assunto', async () => {
    render(<GerenciarConteudo subjects={mockSubjects} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);

    const selectModulo = screen.getAllByRole('combobox').find(combo => (combo as HTMLSelectElement).querySelector('option[value="Módulo 1"]'));
    if(selectModulo) fireEvent.change(selectModulo, { target: { value: 'Módulo 1' } });

    // Clica em Novo módulo para testar o modo Input text fallback
    fireEvent.change(selectModulo!, { target: { value: '__new__' } });
    
    // Agora Módulo deve ter virado text input
    const inputModulo = screen.getByPlaceholderText(/Ex: Matemática/i);
    fireEvent.change(inputModulo, { target: { value: 'Módulo 2' } });

    const inputArea = screen.getByPlaceholderText(/Ex: Álgebra/i);
    fireEvent.change(inputArea, { target: { value: 'Física' } });

    const inputAula = screen.getByPlaceholderText(/Ex: Funções de Primeiro Grau/i);
    fireEvent.change(inputAula, { target: { value: 'Termologia' } });

    // Clica em Salvar
    const saveBtn = screen.getByRole('button', { name: /REGISTRAR ESTUDO/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onAddMock).toHaveBeenCalledWith(expect.objectContaining({
        modulo: 'Módulo 2',
        area: 'Física',
        aulaPrincipal: 'Termologia',
      }));
    });
  });

  it('chama onRemove ao clicar na lixeira do assunto', () => {
    render(<GerenciarConteudo subjects={mockSubjects} onAdd={onAddMock} onRemove={onRemoveMock} onClose={onCloseMock} />);
    
    const trashButtons = screen.getAllByRole('button').filter(btn => btn.className.includes('text-red'));
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
