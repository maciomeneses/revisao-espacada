import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppContent } from '../src/App';

// Mock all sub-components that have side-effects or heavy deps
vi.mock('../src/hooks/useSubjects', () => ({
  useSubjects: () => ({
    subjects: [],
    toggleAula: vi.fn(),
    registerReview: vi.fn(),
    registerFixacao: vi.fn(),
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
    reviewEvents: {
      list: vi.fn().mockResolvedValue([]),
    }
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
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('exibe LandingPage na rota raiz quando não autenticado', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppContent />
      </MemoryRouter>
    );
    // LandingPage tem o título principal
    expect(screen.getByText(/Domine seu aprendizado/i)).toBeInTheDocument();
  });

  it('redireciona para /login ao tentar acessar área protegida sem sessão', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppContent />
      </MemoryRouter>
    );
    // Deve renderizar a AuthScreen (login)
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('exibe app autenticado quando há sessão válida e acessa /dashboard', () => {
    localStorageMock.setItem(
      'ebbin_session',
      JSON.stringify({ email: 'user@test.com', token: 'jwt-valid', role: 'USER', timestamp: Date.now() })
    );

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppContent />
      </MemoryRouter>
    );
    // Header logado deve exibir "EBBIN" (maiúsculo no Header, diferente da Landing)
    expect(screen.getByText('EBBIN')).toBeInTheDocument();
    // Dashboard deve estar visível
    expect(screen.getByText(/Plataforma de Revisão Espaçada/i)).toBeInTheDocument();
  });

  it('limpa sessão e vai para landing page no logout', async () => {
    localStorageMock.setItem(
      'ebbin_session',
      JSON.stringify({ email: 'user@test.com', token: 'jwt-valid', role: 'USER', timestamp: Date.now() })
    );

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppContent />
      </MemoryRouter>
    );

    // Clica no botão Sair (o Header está visível poisisAuthenticated é true)
    const logoutBtn = screen.getByRole('button', { name: /Sair/i });
    fireEvent.click(logoutBtn);

    // No logout, o AppContent chama navigate('/') e setIsAuthenticated(false)
    // O re-render deve mostrar a Landing Page
    await waitFor(() => {
      // Procuramos por texto exclusivo da Landing Page
      expect(screen.getByText(/Domine seu aprendizado/i)).toBeInTheDocument();
    });
    
    expect(localStorageMock.getItem('ebbin_session')).toBeNull();
  });


  it('exibe AuthScreen quando sessão no localStorage tem JSON inválido', () => {
    localStorageMock.setItem('ebbin_session', 'invalid-json{{{');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppContent />
      </MemoryRouter>
    );
    // Redireciona para login ao falhar o parse do JSON
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });
});

