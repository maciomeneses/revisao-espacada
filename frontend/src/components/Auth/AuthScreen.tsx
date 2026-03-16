import React, { useState } from 'react';
import { LogIn, Mail, Lock, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface AuthScreenProps {
  onLogin: (email: string, token: string, role: string) => void;
}

type AuthMode = 'login' | 'forgot-password';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    // Limpar sessão anterior para evitar headers de autorização antigos
    localStorage.removeItem('ebbin_session');
    try {
      const res = await api.auth.login(email, password);
      onLogin(res.email, res.token, res.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciais inválidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!email) {
      setError('Por favor, insira seu e-mail.');
      return;
    }
    setIsLoading(true);
    try {
      await api.auth.forgotPassword(email);
      // Mensagem genérica intencional — não revela se o e-mail existe (anti-user-enumeration)
      setSuccessMessage('As instruções para redefinir sua senha foram enviadas para o seu e-mail.');
    } catch {
      setError('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-md" style={{ backgroundColor: '#1F3A5F' }}>
            <KeyRound className="w-8 h-8 text-yellow" />
          </div>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Ebbin</h1>
          <p className="text-muted mt-2">Plataforma de Revisão Espaçada</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 shadow-md">
          {mode === 'login' ? (
            <>
              <h2 className="text-xl font-bold text-navy mb-6 flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Acesse sua conta
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light" />
                    <input
                      type="email"
                      required
                      name="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-alt border border-[#e2e8f0] rounded-xl py-2.5 pl-11 pr-4 text-navy placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-sky/40 transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-navy uppercase tracking-wide">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot-password'); setError(null); setSuccessMessage(null); }}
                      className="text-xs text-sky hover:text-sky-dark transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light" />
                    <input
                      type="password"
                      required
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-alt border border-[#e2e8f0] rounded-xl py-2.5 pl-11 pr-4 text-navy placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-sky/40 transition-all"
                      placeholder="••••••••"
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
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-[#e2e8f0] text-center">
                <p className="text-muted text-sm">
                  O cadastro de novos usuários é realizado apenas por administradores.
                </p>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
                className="flex items-center gap-2 text-muted hover:text-navy transition-colors mb-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </button>

              <h2 className="text-xl font-bold text-navy mb-2">Recuperar senha</h2>
              <p className="text-muted text-sm mb-6">
                Informe o seu e-mail para receber as instruções de recuperação.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1.5">
                    E-mail cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-alt border border-[#e2e8f0] rounded-xl py-2.5 pl-11 pr-4 text-navy placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-sky/40 transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !!successMessage}
                  className="w-full font-bold py-3 rounded-full transition-all shadow-md flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#FFC72C', color: '#1F3A5F' }}
                >
                  {isLoading ? 'Processando...' : 'Enviar instruções'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
