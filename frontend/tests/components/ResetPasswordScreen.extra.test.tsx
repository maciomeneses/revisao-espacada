import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResetPasswordScreen } from '../../src/components/Auth/ResetPasswordScreen';

vi.mock('../../src/services/api', () => ({
  api: {
    auth: { resetPassword: vi.fn().mockResolvedValue(undefined) },
  },
}));

const onSuccess = vi.fn();

describe('ResetPasswordScreen (cobertura extra)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mouseEnter/mouseLeave nos botões cobrem handlers de hover', async () => {
    render(<ResetPasswordScreen token="t" onSuccess={onSuccess} />);

    const submit = screen.getByRole('button', { name: /redefinir senha/i });
    fireEvent.mouseEnter(submit);
    fireEvent.mouseLeave(submit);

    // Faz sucesso para renderizar o botão "Ir para o login"
    fireEvent.change(screen.getByPlaceholderText('mínimo 6 caracteres'), {
      target: { value: 'senha123' },
    });
    fireEvent.change(screen.getByPlaceholderText('repita a nova senha'), {
      target: { value: 'senha123' },
    });
    fireEvent.click(submit);

    const goLogin = await screen.findByRole('button', { name: /ir para o login/i });
    fireEvent.mouseEnter(goLogin);
    fireEvent.mouseLeave(goLogin);

    expect(goLogin).toBeInTheDocument();
  });
});
