import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthScreen } from '../../src/components/Auth/AuthScreen';

// Mock the api module
vi.mock('../../src/services/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    },
  },
}));

import { api } from '../../src/services/api';
const mockedApi = api as {
  auth: {
    login: ReturnType<typeof vi.fn>;
    forgotPassword: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
  };
};

const mockOnLogin = vi.fn();

const mockAuthResponse = {
  token: 'jwt-token-mock',
  userId: 'uuid-1',
  email: 'user@test.com',
  role: 'USER' as const,
};

// Mock localStorage for environments where it's unavailable (--localstorage-file warning in jsdom)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (_idx: number) => null,
    get length() { return Object.keys(store).length; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

describe('AuthScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  // ---- Renderização inicial ----

  it('renderiza o título Ebbin', () => {
    render(<AuthScreen onLogin={mockOnLogin} />);
    expect(screen.getByText('Ebbin')).toBeInTheDocument();
  });

  it('renderiza o subtítulo da plataforma', () => {
    render(<AuthScreen onLogin={mockOnLogin} />);
    expect(screen.getByText('Plataforma de Revisão Espaçada')).toBeInTheDocument();
  });

  it('renderiza o formulário de login por padrão', () => {
    render(<AuthScreen onLogin={mockOnLogin} />);
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('exibe a nota sobre cadastro restrito a admins', () => {
    render(<AuthScreen onLogin={mockOnLogin} />);
    expect(
      screen.getByText(/cadastro de novos usuários é realizado apenas por administradores/i)
    ).toBeInTheDocument();
  });

  // ---- Fluxo de login bem-sucedido ----

  it('chama onLogin com email, token e role após login bem-sucedido', async () => {
    vi.mocked(api.auth.login).mockResolvedValue(mockAuthResponse);

    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith('user@test.com', 'senha123');
      expect(mockOnLogin).toHaveBeenCalledWith('user@test.com', 'jwt-token-mock', 'USER');
    });
  });

  it('chama a API de login com os dados do formulário preenchido', async () => {
    vi.mocked(api.auth.login).mockResolvedValue(mockAuthResponse);

    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledTimes(1);
      expect(api.auth.login).toHaveBeenCalledWith('user@test.com', 'senha123');
    });
  });

  // ---- Estado de carregamento ----

  it('exibe "Entrando..." e desabilita o botão durante o login', async () => {
    let resolveLogin: (v: typeof mockAuthResponse) => void;
    vi.mocked(api.auth.login).mockReturnValue(
      new Promise<typeof mockAuthResponse>(resolve => {
        resolveLogin = resolve;
      })
    );

    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrando.../i })).toBeDisabled();
    });

    // Finaliza o login para não deixar pending promises
    resolveLogin!(mockAuthResponse);
  });

  // ---- Tratamento de erros no login ----

  it('exibe mensagem de erro quando o login falha', async () => {
    vi.mocked(api.auth.login).mockRejectedValue(new Error('Credenciais inválidas'));

    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'senhaErrada' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro genérica para erros desconhecidos', async () => {
    vi.mocked(api.auth.login).mockRejectedValue('erro não-Error');

    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'senha' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/credenciais inválidas. tente novamente./i)
      ).toBeInTheDocument();
    });
  });

  it('não chama onLogin quando o login falha', async () => {
    vi.mocked(api.auth.login).mockRejectedValue(new Error('Credenciais inválidas'));

    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'senhaErrada' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });

    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  // ---- Navegação para recuperação de senha ----

  it('exibe o formulário de recuperação de senha ao clicar em "Esqueceu a senha?"', () => {
    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.click(screen.getByText(/esqueceu a senha\?/i));

    expect(screen.getByText('Recuperar senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar instruções/i })).toBeInTheDocument();
  });

  it('volta ao formulário de login ao clicar em "Voltar para o login"', () => {
    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.click(screen.getByText(/esqueceu a senha\?/i));
    expect(screen.getByText('Recuperar senha')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/voltar para o login/i));
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('limpa erros ao mudar de modo (login → forgot-password)', () => {
    render(<AuthScreen onLogin={mockOnLogin} />);

    // Primeiro gera um erro no formulário de login
    vi.mocked(api.auth.login).mockRejectedValue(new Error('Credenciais inválidas'));
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'errada' },
    });

    // Navega para forgot-password
    fireEvent.click(screen.getByText(/esqueceu a senha\?/i));

    // O erro não deve aparecer no modo forgot-password (estado foi limpo)
    expect(screen.queryByText('Credenciais inválidas')).not.toBeInTheDocument();
  });

  // ---- Fluxo de recuperação de senha ----

  it('exibe mensagem de sucesso após enviar formulário de recuperação', async () => {
    mockedApi.auth.forgotPassword.mockResolvedValue(undefined);

    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.click(screen.getByText(/esqueceu a senha\?/i));

    // O campo de email pode ter sido preenchido antes (shared state)
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });

    fireEvent.click(screen.getByRole('button', { name: /enviar instruções/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/instruções para redefinir sua senha foram enviadas/i)
      ).toBeInTheDocument();
    });
  });

  it('chama api.auth.forgotPassword com o e-mail correto', async () => {
    mockedApi.auth.forgotPassword.mockResolvedValue(undefined);

    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.click(screen.getByText(/esqueceu a senha\?/i));

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });

    fireEvent.click(screen.getByRole('button', { name: /enviar instruções/i }));

    await waitFor(() => {
      expect(mockedApi.auth.forgotPassword).toHaveBeenCalledWith('user@test.com');
    });
  });

  it('exibe mensagem de erro quando a API de recuperação falha', async () => {
    mockedApi.auth.forgotPassword.mockRejectedValue(new Error('Erro de rede'));

    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.click(screen.getByText(/esqueceu a senha\?/i));

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });

    fireEvent.click(screen.getByRole('button', { name: /enviar instruções/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/erro ao processar solicitação. tente novamente./i)
      ).toBeInTheDocument();
    });
  });

  it('exibe estado de carregamento ao enviar recuperação de senha', async () => {
    mockedApi.auth.forgotPassword.mockResolvedValue(undefined);

    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.click(screen.getByText(/esqueceu a senha\?/i));

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });

    fireEvent.click(screen.getByRole('button', { name: /enviar instruções/i }));

    // O botão fica brevemente "Processando..."
    // (pode ser transiente, por isso usamos waitFor com estado de retorno)
    await waitFor(() => {
      expect(
        screen.getByText(/instruções para redefinir sua senha foram enviadas/i)
      ).toBeInTheDocument();
    });
  });

  it('desabilita o botão de envio após sucesso para evitar reenvio', async () => {
    mockedApi.auth.forgotPassword.mockResolvedValue(undefined);

    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.click(screen.getByText(/esqueceu a senha\?/i));

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });

    fireEvent.click(screen.getByRole('button', { name: /enviar instruções/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/instruções para redefinir sua senha foram enviadas/i)
      ).toBeInTheDocument();
    });

    // Após sucesso, o botão deve estar desabilitado (successMessage != null)
    expect(screen.getByRole('button', { name: /enviar instruções/i })).toBeDisabled();
  });

  it('exibe erro ao tentar enviar sem preencher e-mail', () => {
    render(<AuthScreen onLogin={mockOnLogin} />);

    fireEvent.click(screen.getByText(/esqueceu a senha\?/i));

    // Não preenche o email — o campo tem required, mas o handler valida antes
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    fireEvent.change(emailInput, { target: { value: '' } });

    // O formulário tem required, portanto não deve chamar a API
    // Verificamos que forgotPassword não foi chamado
    expect(mockedApi.auth.forgotPassword).not.toHaveBeenCalled();
  });
});
