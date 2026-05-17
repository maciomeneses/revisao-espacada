import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthScreen } from '../../src/components/Auth/AuthScreen';
import { api } from '../../src/services/api';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../src/services/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
      forgotPassword: vi.fn(),
    },
  },
}));

describe('AuthScreen (cobertura extra)', () => {
  const onLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = () =>
    render(
      <MemoryRouter>
        <AuthScreen onLogin={onLogin} />
      </MemoryRouter>,
    );

  it('clica em "Voltar ao site" e chama navigate("/")', () => {
    renderWithRouter();
    fireEvent.click(screen.getByText(/Voltar ao site/i));
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('dispara mouseEnter/mouseLeave no botão Entrar (cobre handlers de hover)', () => {
    renderWithRouter();
    const btn = screen.getByRole('button', { name: /Entrar/i });
    fireEvent.mouseEnter(btn);
    fireEvent.mouseLeave(btn);
    // sanity: cor inline deve voltar ao default (FFC72C = rgb(255, 199, 44))
    expect(btn.getAttribute('style')).toContain('rgb(255, 199, 44)');
  });

  it('forgot-password mostra mensagem de sucesso quando API responde', async () => {
    vi.mocked(api.auth.forgotPassword).mockResolvedValue(undefined);
    renderWithRouter();

    fireEvent.click(screen.getByText(/Esqueceu a senha\?/i));
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar instruções/i }));

    await waitFor(() => {
      expect(screen.getByText(/instruções para redefinir/i)).toBeInTheDocument();
    });
  });

  it('forgot-password mostra erro genérico quando API rejeita', async () => {
    vi.mocked(api.auth.forgotPassword).mockRejectedValue(new Error('boom'));
    renderWithRouter();

    fireEvent.click(screen.getByText(/Esqueceu a senha\?/i));
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar instruções/i }));

    await waitFor(() => {
      expect(screen.getByText(/Erro ao processar solicitação/i)).toBeInTheDocument();
    });
  });

  it('erro de login não-Error usa mensagem padrão (fallback)', async () => {
    vi.mocked(api.auth.login).mockRejectedValue('string-error');
    renderWithRouter();

    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'pwd123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Credenciais inválidas. Tente novamente./i)).toBeInTheDocument();
    });
  });

  it('input change no formulário de recover atualiza e-mail', () => {
    renderWithRouter();
    fireEvent.click(screen.getByText(/Esqueceu a senha\?/i));
    const recoverInput = screen.getByPlaceholderText('seu@email.com');
    fireEvent.change(recoverInput, { target: { value: 'recover@test.com' } });
    expect((recoverInput as HTMLInputElement).value).toBe('recover@test.com');
  });
});
