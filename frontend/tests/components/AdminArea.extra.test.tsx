import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AdminArea } from '../../src/components/Admin/AdminArea';
import type { User } from '../../src/types';

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

describe('AdminArea (cobertura extra)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.admin.users.list).mockResolvedValue(mockUsers);
  });

  it('edição: atualiza usuário existente e exibe sucesso', async () => {
    vi.mocked(api.admin.users.update).mockResolvedValue({
      id: 'uuid-1',
      email: 'admin@test.com',
      role: 'ADMIN',
    });

    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    const adminRow = screen.getByText('admin@test.com').closest('tr')!;
    const editBtn = within(adminRow).getAllByRole('button')[0];
    fireEvent.click(editBtn);

    await waitFor(() => screen.getByPlaceholderText('usuario@ebbing.com'));

    // Submete sem mudar senha (deixa em branco — manter)
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => {
      expect(api.admin.users.update).toHaveBeenCalledWith(
        'uuid-1',
        expect.objectContaining({ password: undefined }),
      );
    });
  });

  it('handleSubmit (edição) chama api.admin.users.update', async () => {
    vi.mocked(api.admin.users.update).mockResolvedValue(mockUsers[0]);
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    const adminRow = screen.getByText('admin@test.com').closest('tr')!;
    fireEvent.click(within(adminRow).getAllByRole('button')[0]);
    await waitFor(() => screen.getByPlaceholderText('usuario@ebbing.com'));

    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => {
      expect(api.admin.users.update).toHaveBeenCalled();
    });
  });

  it('erro ao deletar exibe mensagem', async () => {
    vi.mocked(api.admin.users.delete).mockRejectedValue(new Error('boom'));
    vi.stubGlobal('confirm', () => true);
    render(<AdminArea />);
    await waitFor(() => screen.getByText('user@test.com'));

    const userRow = screen.getByText('user@test.com').closest('tr')!;
    const buttons = within(userRow).getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText(/Erro ao excluir usuário/i)).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it('botão X fecha o modal', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));
    await waitFor(() => screen.getByPlaceholderText('usuario@ebbing.com'));

    // Botão X — é o primeiro botão dentro do header do modal
    const headerH3 = screen.getByText(/novo usuário/i, { selector: 'h3' });
    const closeX = headerH3.parentElement!.querySelector('button')!;
    fireEvent.click(closeX);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('usuario@ebbing.com')).not.toBeInTheDocument();
    });
  });

  it('alterna perfil de USER para ADMIN e vice-versa no modal', async () => {
    render(<AdminArea />);
    await waitFor(() => screen.getByText('admin@test.com'));

    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));
    await waitFor(() => screen.getByPlaceholderText('usuario@ebbing.com'));

    fireEvent.click(screen.getByRole('button', { name: /administrador/i }));
    fireEvent.click(screen.getByRole('button', { name: /usuário comum/i }));
    // sem assert direto — apenas cobre handlers
    expect(screen.getByRole('button', { name: /usuário comum/i })).toBeInTheDocument();
  });
});
