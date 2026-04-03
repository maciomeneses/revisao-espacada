import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthScreen } from '../../src/components/Auth/AuthScreen';
import { api } from '../../src/services/api';

// Mock the api module
vi.mock('../../src/services/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
      forgotPassword: vi.fn(),
    },
  },
}));

describe('AuthScreen', () => {
  const onLoginMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('renderiza o título Ebbin', () => {
    renderWithRouter(<AuthScreen onLogin={onLoginMock} />);
    expect(screen.getByText('Ebbin')).toBeInTheDocument();
  });

  it('renderiza o subtítulo da plataforma', () => {
    renderWithRouter(<AuthScreen onLogin={onLoginMock} />);
    expect(screen.getByText('Plataforma de Revisão Espaçada')).toBeInTheDocument();
  });

  it('renderiza o formulário de login por padrão', () => {
    renderWithRouter(<AuthScreen onLogin={onLoginMock} />);
    expect(screen.getByText('Acesse sua conta')).toBeInTheDocument();
  });

  it('chama onLogin com dados corretos após login bem-sucedido', async () => {
    const mockResponse = { email: 'test@test.com', token: 'jwt-123', role: 'USER' as any, userId: '1' };
    vi.mocked(api.auth.login).mockResolvedValue(mockResponse);

    renderWithRouter(<AuthScreen onLogin={onLoginMock} />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(onLoginMock).toHaveBeenCalledWith('test@test.com', 'jwt-123', 'USER');
    });
  });

  it('exibe mensagem de erro quando o login falha', async () => {
    vi.mocked(api.auth.login).mockRejectedValue(new Error('Credenciais inválidas'));

    renderWithRouter(<AuthScreen onLogin={onLoginMock} />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'err@test.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Credenciais inválidas'))).toBeInTheDocument();
    });
  });

  it('navega para recuperação de senha e volta', () => {
    renderWithRouter(<AuthScreen onLogin={onLoginMock} />);

    fireEvent.click(screen.getByText(/Esqueceu a senha\?/i));
    expect(screen.getByText('Recuperar senha')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Voltar para o login/i));
    expect(screen.getByText('Acesse sua conta')).toBeInTheDocument();
  });

  it('exibe erro ao tentar recuperar senha sem preencher e-mail', async () => {
    renderWithRouter(<AuthScreen onLogin={onLoginMock} />);

    fireEvent.click(screen.getByText(/Esqueceu a senha\?/i));
    fireEvent.click(screen.getByRole('button', { name: /Enviar instruções/i }));

    // O erro é renderizado via state, usamos findByText para lidar com o ciclo de vida do React
    const errorMsg = await screen.findByText((content, element) => {
      return content.toLowerCase().includes('por favor') && content.toLowerCase().includes('insira seu e-mail');
    });
    expect(errorMsg).toBeInTheDocument();
  });
});
