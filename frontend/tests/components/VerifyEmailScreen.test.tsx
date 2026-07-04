import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VerifyEmailScreen } from '../../src/components/Auth/VerifyEmailScreen';
import { api } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  api: {
    auth: {
      verifyEmail: vi.fn(),
    },
  },
}));

describe('VerifyEmailScreen', () => {
  const onVerified = vi.fn();
  const onBackToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra estado de carregamento e chama a API com o token', () => {
    vi.mocked(api.auth.verifyEmail).mockReturnValue(new Promise(() => {}));

    render(
      <VerifyEmailScreen token="tok-1" onVerified={onVerified} onBackToLogin={onBackToLogin} />,
    );

    expect(screen.getByText(/Confirmando seu e-mail/i)).toBeInTheDocument();
    expect(api.auth.verifyEmail).toHaveBeenCalledWith('tok-1');
    expect(api.auth.verifyEmail).toHaveBeenCalledTimes(1);
  });

  it('sucesso: chama onVerified com a sessão retornada (auto-login)', async () => {
    vi.mocked(api.auth.verifyEmail).mockResolvedValue({
      email: 'novo@test.com',
      token: 'jwt-abc',
      role: 'USER',
      userId: 'u1',
    } as never);

    render(
      <VerifyEmailScreen token="tok-2" onVerified={onVerified} onBackToLogin={onBackToLogin} />,
    );

    await waitFor(() => {
      expect(onVerified).toHaveBeenCalledWith('novo@test.com', 'jwt-abc', 'USER');
    });
  });

  it('erro: mostra a mensagem do backend e botão de voltar', async () => {
    vi.mocked(api.auth.verifyEmail).mockRejectedValue(
      new Error('Token de verificação inválido ou expirado'),
    );

    render(
      <VerifyEmailScreen token="tok-3" onVerified={onVerified} onBackToLogin={onBackToLogin} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/inválido ou expirado/i)).toBeInTheDocument();
    });
    expect(onVerified).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Voltar para o login/i }));
    expect(onBackToLogin).toHaveBeenCalled();
  });

  it('erro não-Error usa mensagem genérica', async () => {
    vi.mocked(api.auth.verifyEmail).mockRejectedValue('boom');

    render(
      <VerifyEmailScreen token="tok-4" onVerified={onVerified} onBackToLogin={onBackToLogin} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Cadastre-se novamente/i)).toBeInTheDocument();
    });
  });
});
