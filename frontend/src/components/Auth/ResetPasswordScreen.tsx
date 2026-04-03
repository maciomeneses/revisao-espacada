import React, { useState } from 'react';
import { KeyRound, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

interface ResetPasswordScreenProps {
  /** Token de reset extraído do query param ?token= */
  token: string;
  /** Callback chamado após reset bem-sucedido para redirecionar ao login */
  onSuccess: () => void;
}

/**
 * Tela de redefinição de senha acessível via link ?token=<uuid>.
 *
 * Valida os campos localmente antes de chamar o endpoint
 * POST /api/auth/reset-password e exibe feedback inline ao usuário.
 */
export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ token, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Token inválido ou expirado. Solicite um novo link de recuperação.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-md"
            style={{ backgroundColor: '#1F3A5F' }}
          >
            <KeyRound className="w-8 h-8 text-yellow" />
          </div>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Ebbing</h1>
          <p className="text-muted mt-2">Plataforma de Revisão Espaçada</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 shadow-md">
          <h2 className="text-xl font-bold text-navy mb-2">Redefinir senha</h2>
          <p className="text-muted text-sm mb-6">
            Escolha uma nova senha para a sua conta.
          </p>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 text-sm text-green-700">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Senha redefinida com sucesso!</p>
                  <p className="mt-1">Você já pode fazer login com a nova senha.</p>
                </div>
              </div>
              <button
                onClick={onSuccess}
                className="w-full font-bold py-3 rounded-full transition-all shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: '#FFC72C', color: '#1F3A5F' }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e6b000')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFC72C')}
              >
                Ir para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1.5">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    name="new-password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-surface-alt border border-[#e2e8f0] rounded-xl py-2.5 pl-11 pr-4 text-navy placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-sky/40 transition-all"
                    placeholder="mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1.5">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    name="confirm-password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-surface-alt border border-[#e2e8f0] rounded-xl py-2.5 pl-11 pr-4 text-navy placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-sky/40 transition-all"
                    placeholder="repita a nova senha"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full font-bold py-3 rounded-full transition-all shadow-md flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#FFC72C', color: '#1F3A5F' }}
                onMouseEnter={e => !isLoading && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e6b000')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFC72C')}
              >
                {isLoading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
