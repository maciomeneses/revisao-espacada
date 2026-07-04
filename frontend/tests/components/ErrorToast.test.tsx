import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorToast } from '../../src/components/ErrorToast';

describe('ErrorToast', () => {
  it('não renderiza nada quando message é null', () => {
    const { container } = render(<ErrorToast message={null} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('exibe a mensagem de erro como alert quando message está presente', () => {
    render(<ErrorToast message="Não foi possível criar o assunto." onDismiss={vi.fn()} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível criar o assunto.');
  });

  it('chama onDismiss ao clicar no botão de fechar', () => {
    const onDismiss = vi.fn();
    render(<ErrorToast message="Erro de rede" onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: /fechar aviso de erro/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
