import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, MailCheck } from 'lucide-react';
import { api } from '../../services/api';

interface VerifyEmailScreenProps {
  token: string;
  /** Chamado com a sessão retornada pelo backend após confirmação (auto-login). */
  onVerified: (email: string, token: string, role: string) => void;
  /** Chamado quando o usuário desiste após um erro (volta ao login). */
  onBackToLogin: () => void;
}

/**
 * Tela de confirmação de e-mail do auto-cadastro (issue #59).
 *
 * Recebe o token do link (`/?verify=<token>`), chama o backend e, em caso de
 * sucesso, entrega a sessão para auto-login. Mesmo padrão visual do
 * ResetPasswordScreen.
 */
export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({
  token,
  onVerified,
  onBackToLogin,
}) => {
  const [error, setError] = useState<string | null>(null);
  // Evita chamada dupla em StrictMode/re-render: o token é de uso único.
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    api.auth
      .verifyEmail(token)
      .then((res) => onVerified(res.email, res.token, res.role))
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Link de confirmação inválido ou expirado. Cadastre-se novamente para receber um novo link.',
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/ebbing-logo.png?v=1" alt="Logo Ebbing" className="h-16 mb-2 object-contain" />
          <p className="text-muted">Plataforma de Revisão Espaçada</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 shadow-md text-center">
          {error ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-600 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
              <button
                onClick={onBackToLogin}
                className="w-full font-bold py-3 rounded-full transition-all shadow-md mt-6"
                style={{ backgroundColor: '#FFC72C', color: '#1F3A5F' }}
              >
                Voltar para o login
              </button>
            </>
          ) : (
            <>
              <MailCheck className="w-10 h-10 mx-auto text-sky mb-4" />
              <h2 className="text-xl font-bold text-navy mb-2">Confirmando seu e-mail…</h2>
              <p className="text-muted text-sm">Aguarde, você será conectado automaticamente.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
