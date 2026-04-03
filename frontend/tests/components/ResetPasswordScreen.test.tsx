import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResetPasswordScreen } from '../../src/components/Auth/ResetPasswordScreen';

vi.mock('../../src/services/api', () => ({
  api: {
    auth: {
      resetPassword: vi.fn(),
    },
  },
}));

import { api } from '../../src/services/api';
const mockedApi = api as {
  auth: { resetPassword: ReturnType<typeof vi.fn> };
};

const mockOnSuccess = vi.fn();
const VALID_TOKEN = 'valid-uuid-token-1234';

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Renderização ----

  it('renderiza o título Ebbing', () => {
    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);
    expect(screen.getByText('Ebbing')).toBeInTheDocument();
  });

  it('renderiza o subtítulo da plataforma', () => {
    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);
    expect(screen.getByText('Plataforma de Revisão Espaçada')).toBeInTheDocument();
  });

  it('renderiza o formulário de redefinição de senha', () => {
    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);
    expect(screen.getByPlaceholderText('mínimo 6 caracteres')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('repita a nova senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redefinir senha/i })).toBeInTheDocument();
  });

  it('renderiza o cabeçalho "Redefinir senha"', () => {
    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);
    expect(screen.getByRole('heading', { name: 'Redefinir senha' })).toBeInTheDocument();
  });

  // ---- Validação local ----

  it('exibe erro quando a senha tem menos de 6 caracteres', async () => {
    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('mínimo 6 caracteres'), {
      target: { value: 'abc' },
    });
    fireEvent.change(screen.getByPlaceholderText('repita a nova senha'), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText(/senha deve ter no mínimo 6 caracteres/i)).toBeInTheDocument();
    });

    expect(mockedApi.auth.resetPassword).not.toHaveBeenCalled();
  });

  it('exibe erro quando as senhas não coincidem', async () => {
    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('mínimo 6 caracteres'), {
      target: { value: 'senha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('repita a nova senha'), {
      target: { value: 'diferente123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument();
    });

    expect(mockedApi.auth.resetPassword).not.toHaveBeenCalled();
  });

  // ---- Fluxo bem-sucedido ----

  it('chama api.auth.resetPassword com o token e a nova senha corretos', async () => {
    mockedApi.auth.resetPassword.mockResolvedValue(undefined);

    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('mínimo 6 caracteres'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('repita a nova senha'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(mockedApi.auth.resetPassword).toHaveBeenCalledWith(VALID_TOKEN, 'novaSenha123');
    });
  });

  it('exibe mensagem de sucesso após reset bem-sucedido', async () => {
    mockedApi.auth.resetPassword.mockResolvedValue(undefined);

    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('mínimo 6 caracteres'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('repita a nova senha'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText(/senha redefinida com sucesso/i)).toBeInTheDocument();
    });
  });

  it('exibe botão "Ir para o login" após reset bem-sucedido', async () => {
    mockedApi.auth.resetPassword.mockResolvedValue(undefined);

    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('mínimo 6 caracteres'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('repita a nova senha'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ir para o login/i })).toBeInTheDocument();
    });
  });

  it('chama onSuccess ao clicar em "Ir para o login" após reset bem-sucedido', async () => {
    mockedApi.auth.resetPassword.mockResolvedValue(undefined);

    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('mínimo 6 caracteres'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('repita a nova senha'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ir para o login/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /ir para o login/i }));
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });

  // ---- Tratamento de erros da API ----

  it('exibe mensagem de erro da API quando o token é inválido', async () => {
    mockedApi.auth.resetPassword.mockRejectedValue(
      new Error('Token de reset inválido ou expirado')
    );

    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('mínimo 6 caracteres'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('repita a nova senha'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText(/token de reset inválido ou expirado/i)).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro genérica para erros não-Error da API', async () => {
    mockedApi.auth.resetPassword.mockRejectedValue('erro-nao-tipado');

    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('mínimo 6 caracteres'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('repita a nova senha'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText(/token inválido ou expirado. solicite um novo link/i)).toBeInTheDocument();
    });
  });

  it('não chama onSuccess quando o reset falha', async () => {
    mockedApi.auth.resetPassword.mockRejectedValue(new Error('Erro'));

    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('mínimo 6 caracteres'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('repita a nova senha'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText('Erro')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  // ---- Estado de carregamento ----

  it('exibe "Salvando..." e desabilita o botão durante o envio', async () => {
    let resolveReset: () => void;
    mockedApi.auth.resetPassword.mockReturnValue(
      new Promise<void>(resolve => { resolveReset = resolve; })
    );

    render(<ResetPasswordScreen token={VALID_TOKEN} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('mínimo 6 caracteres'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('repita a nova senha'), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /salvando.../i })).toBeDisabled();
    });

    resolveReset!();
  });
});
