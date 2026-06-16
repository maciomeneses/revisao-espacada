import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AdminArea } from '../../src/components/Admin/AdminArea';
import type { User } from '../../src/types';

// Mock the api module
vi.mock('../../src/services/api', () => ({
  api: {
    admin: {
      users: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  },
}));

import { api } from '../../src/services/api';

const mockUsers: User[] = [
  { id: 'uuid-1', email: 'admin@test.com', role: 'ADMIN' },
  { id: 'uuid-2', email: 'user@test.com', role: 'USER' },
];

describe('AdminArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.admin.users.list).mockResolvedValue(mockUsers);
  });

  it('renderiza título da seção Admin', async () => {
    render(<AdminArea />);
    expect(screen.getByText('Administração')).toBeInTheDocument();
  });

  it('exibe "Carregando usuários..." enquanto faz o fetch', () => {
    // Keep the promise pending
    vi.mocked(api.admin.users.list).mockReturnValue(new Promise(() => {}));
    render(<AdminArea />);
    expect(screen.getByText(/Carregando usuários/i)).toBeInTheDocument();
  });

  it('lista usuários carregados da API', async () => {
    render(<AdminArea />);
    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });
  });

  it('exibe estatística de total correta', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));
    // Stats card shows "Total" label and the count below it
    const totalLabel = screen.getByText('Total');
    const countEl = totalLabel.nextElementSibling;
    expect(countEl?.textContent).toBe('2');
  });

  it('exibe estatística de admins correta', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));
    const adminsLabel = screen.getByText('Admins');
    const countEl = adminsLabel.nextElementSibling;
    expect(countEl?.textContent).toBe('1');
  });

  it('exibe "Nenhum usuário encontrado." quando lista está vazia', async () => {
    vi.mocked(api.admin.users.list).mockResolvedValue([]);
    render(<AdminArea />);
    await waitFor(() => {
      expect(screen.getByText(/Nenhum usuário encontrado/i)).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro quando API falha', async () => {
    vi.mocked(api.admin.users.list).mockRejectedValue(new Error('Network error'));
    render(<AdminArea />);
    await waitFor(() => {
      expect(screen.getByText(/Falha ao carregar usuários/i)).toBeInTheDocument();
    });
  });

  it('abre modal de criação ao clicar no botão Novo Usuário', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    // Click the button (not the modal heading)
    const newUserBtn = screen.getByRole('button', { name: /novo usuário/i });
    fireEvent.click(newUserBtn);

    // Modal heading should appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('usuario@ebbing.com')).toBeInTheDocument();
    });
  });

  it('não chama api.create quando senha está ausente (proteção no handleSubmit)', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));
    await waitFor(() => screen.getByPlaceholderText('usuario@ebbing.com'));

    fireEvent.change(screen.getByPlaceholderText('usuario@ebbing.com'), {
      target: { value: 'novo@test.com' },
    });
    // Intentionally do NOT fill the password field
    // The HTML5 `required` attribute prevents form submission without a password,
    // so api.create should never be called.
    fireEvent.submit(screen.getByRole('button', { name: /criar usuário/i }).closest('form')!);

    // Give time for any async operations
    await new Promise((r) => setTimeout(r, 50));
    expect(api.admin.users.create).not.toHaveBeenCalled();
  });

  it('cria novo usuário ao submeter formulário preenchido', async () => {
    vi.mocked(api.admin.users.create).mockResolvedValue({
      id: 'uuid-3',
      email: 'novo@test.com',
      role: 'USER',
    });
    vi.mocked(api.admin.users.list)
      .mockResolvedValueOnce(mockUsers)
      .mockResolvedValueOnce([
        ...mockUsers,
        { id: 'uuid-3', email: 'novo@test.com', role: 'USER' },
      ]);

    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));
    await waitFor(() => screen.getByPlaceholderText('usuario@ebbing.com'));

    fireEvent.change(screen.getByPlaceholderText('usuario@ebbing.com'), {
      target: { value: 'novo@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'senha123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /criar usuário/i }));

    await waitFor(() => {
      expect(api.admin.users.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'novo@test.com', password: 'senha123' }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Usuário criado com sucesso/i)).toBeInTheDocument();
    });
  });

  it('filtra usuários por e-mail no campo de busca', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    const searchInput = screen.getByPlaceholderText(/buscar por e-mail/i);
    fireEvent.change(searchInput, { target: { value: 'admin' } });

    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.queryByText('user@test.com')).not.toBeInTheDocument();
  });

  it('abre modal de edição com e-mail pré-preenchido ao clicar em editar', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    // Find the admin user row and click its edit button
    const adminRow = screen.getByText('admin@test.com').closest('tr')!;
    const editBtn = within(adminRow).getAllByRole('button')[0]; // edit is first button
    fireEvent.click(editBtn);

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText('usuario@ebbing.com') as HTMLInputElement;
      expect(emailInput.value).toBe('admin@test.com');
    });
  });

  it('chama api.delete ao confirmar exclusão', async () => {
    vi.mocked(api.admin.users.delete).mockResolvedValue(undefined);
    vi.mocked(api.admin.users.list)
      .mockResolvedValueOnce(mockUsers)
      .mockResolvedValueOnce([mockUsers[0]]);

    vi.stubGlobal('confirm', () => true);

    render(<AdminArea />);
    await waitFor(() => screen.getByText('user@test.com'));

    const userRow = screen.getByText('user@test.com').closest('tr')!;
    const buttons = within(userRow).getAllByRole('button');
    const deleteBtn = buttons[buttons.length - 1]; // delete is last button
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.admin.users.delete).toHaveBeenCalledWith('uuid-2');
    });

    vi.unstubAllGlobals();
  });

  it('não chama api.delete quando confirmação é cancelada', async () => {
    vi.stubGlobal('confirm', () => false);

    render(<AdminArea />);
    await waitFor(() => screen.getByText('user@test.com'));

    const userRow = screen.getByText('user@test.com').closest('tr')!;
    const buttons = within(userRow).getAllByRole('button');
    const deleteBtn = buttons[buttons.length - 1];
    fireEvent.click(deleteBtn);

    expect(api.admin.users.delete).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('exibe dica "Mínimo de 6 caracteres" no campo senha quando vazio e criando usuário', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));
    await waitFor(() => screen.getByPlaceholderText('usuario@ebbing.com'));

    // Dica estática deve aparecer quando campo está vazio e é criação
    expect(screen.getByText(/mínimo de 6 caracteres/i)).toBeInTheDocument();
  });

  it('exibe aviso inline quando senha tem menos de 6 caracteres', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));
    await waitFor(() => screen.getByPlaceholderText('usuario@ebbing.com'));

    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'abc' },
    });

    // Feedback de erro inline deve aparecer para senha curta
    expect(screen.getByText(/a senha deve ter pelo menos 6 caracteres/i)).toBeInTheDocument();
  });

  it('não exibe aviso de senha curta quando senha tem 6 ou mais caracteres', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));
    await waitFor(() => screen.getByPlaceholderText('usuario@ebbing.com'));

    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'senha123' },
    });

    // Aviso de senha curta não deve aparecer
    expect(screen.queryByText(/a senha deve ter pelo menos 6 caracteres/i)).not.toBeInTheDocument();
  });

  it('campo senha tem atributo minLength=6 para validação HTML5 nativa', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));
    await waitFor(() => screen.getByPlaceholderText('usuario@ebbing.com'));

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    expect(passwordInput.minLength).toBe(6);
  });
});
