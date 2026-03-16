import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';

// Mock all sub-components that have side-effects or heavy deps
vi.mock('../src/hooks/useSubjects', () => ({
  useSubjects: () => ({
    subjects: [],
    toggleAula: vi.fn(),
    togglePreAula: vi.fn(),
    toggleFlashcards: vi.fn(),
    registerReview: vi.fn(),
    doResetCiclo: vi.fn(),
    addSubject: vi.fn(),
    removeSubject: vi.fn(),
    revertStage: vi.fn(),
  }),
}));

vi.mock('../src/services/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    },
    subjects: {
      list: vi.fn().mockResolvedValue([]),
      sync: vi.fn().mockResolvedValue([]),
    },
    admin: {
      users: {
        list: vi.fn().mockResolvedValue([]),
      },
    },
  },
}));

// LocalStorage mock
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

describe('App — roteamento e edge cases de autenticação', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Restaura search limpo
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: '', pathname: '/', href: 'http://localhost/' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('exibe AuthScreen quando não autenticado e sem ?token=', () => {
    render(<App />);
    // AuthScreen renderiza "Acesse sua conta" ou o formulário de login
    expect(screen.getByText('Ebbin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('exibe ResetPasswordScreen quando ?token= está presente na URL (sem sessão)', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=abc-test-token-1234', pathname: '/', href: 'http://localhost/?token=abc-test-token-1234' },
      writable: true,
      configurable: true,
    });

    render(<App />);
    // ResetPasswordScreen renderiza "Redefinir senha"
    expect(screen.getByRole('heading', { name: /redefinir senha/i })).toBeInTheDocument();
  });

  it('exibe ResetPasswordScreen quando ?token= está presente mesmo com sessão autenticada (token tem prioridade)', () => {
    // Sessão autenticada no localStorage
    localStorageMock.setItem(
      'ebbin_session',
      JSON.stringify({ email: 'user@test.com', token: 'jwt-valid', role: 'USER', timestamp: Date.now() })
    );

    // URL com ?token= de reset de senha
    Object.defineProperty(window, 'location', {
      value: { search: '?token=reset-token-9999', pathname: '/', href: 'http://localhost/?token=reset-token-9999' },
      writable: true,
      configurable: true,
    });

    render(<App />);
    // ResetPasswordScreen deve ter prioridade sobre sessão autenticada
    expect(screen.getByRole('heading', { name: /redefinir senha/i })).toBeInTheDocument();
  });

  it('exibe app autenticado quando há sessão válida e sem ?token=', () => {
    localStorageMock.setItem(
      'ebbin_session',
      JSON.stringify({ email: 'user@test.com', token: 'jwt-valid', role: 'USER', timestamp: Date.now() })
    );

    render(<App />);
    // O app autenticado renderiza o Header com o logo Ebbin
    expect(screen.getByText('Ebbin')).toBeInTheDocument();
    // Não exibe o formulário de login
    expect(screen.queryByRole('button', { name: /^entrar$/i })).not.toBeInTheDocument();
  });

  it('exibe AuthScreen quando sessão no localStorage tem JSON inválido', () => {
    localStorageMock.setItem('ebbin_session', 'invalid-json{{{');

    render(<App />);
    // JSON inválido deve ser removido e retornar à tela de login
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('exibe AuthScreen quando sessão no localStorage não tem token JWT', () => {
    localStorageMock.setItem(
      'ebbin_session',
      JSON.stringify({ email: 'user@test.com', role: 'USER', timestamp: Date.now() })
      // Note: sem campo 'token'
    );

    render(<App />);
    // Sem token JWT, não autentica
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('após handleResetSuccess, limpa o token da URL e retorna ao login', async () => {
    const replaceStateSpy = vi.fn();
    Object.defineProperty(window, 'history', {
      value: { replaceState: replaceStateSpy },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { search: '?token=valid-reset-token', pathname: '/app', href: 'http://localhost/app?token=valid-reset-token' },
      writable: true,
      configurable: true,
    });

    // Mock da API para sucesso no reset
    const { api } = await import('../src/services/api');
    vi.mocked(api.auth.resetPassword).mockResolvedValue(undefined);

    render(<App />);
    expect(screen.getByRole('heading', { name: /redefinir senha/i })).toBeInTheDocument();

    // Preenche e submete o formulário de reset
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

    // Clica em "Ir para o login"
    fireEvent.click(screen.getByRole('button', { name: /ir para o login/i }));

    // handleResetSuccess deve limpar a URL via replaceState
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/app');

    // Deve exibir tela de login após reset
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });
  });
});
