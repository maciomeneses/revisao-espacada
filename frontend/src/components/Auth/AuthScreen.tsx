import React, { useState } from 'react';
import { LogIn, Mail, Lock, ArrowLeft, AlertCircle, Home, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface AuthScreenProps {
  onLogin: (email: string, token: string, role: string) => void;
}

type AuthMode = 'login' | 'forgot-password' | 'signup';

/** Mesma regra do backend (SignupRequest): 8–100 chars, ao menos 1 letra e 1 número. */
function validatePassword(password: string): string | null {
  if (password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'A senha deve conter ao menos uma letra e um número.';
  }
  return null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    // Limpar sessão anterior para evitar headers de autorização antigos
    localStorage.removeItem('ebbing_session');
    try {
      const res = await api.auth.login(email, password);
      onLogin(res.email, res.token, res.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciais inválidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsLoading(true);
    try {
      await api.auth.signup(email, password);
      // Mensagem genérica intencional — não revela se o e-mail já existe (anti-user-enumeration)
      setSuccessMessage(
        'Cadastro recebido! Enviamos um link de confirmação para o seu e-mail — ele vale por 24 horas.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar cadastro. Tente novamente.');
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
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full relative">
        {/* Back to Landing link */}
        <button
          onClick={() => navigate('/')}
          className="absolute -top-12 left-0 flex items-center gap-2 text-navy/40 hover:text-navy text-xs font-black uppercase tracking-widest transition-all group"
        >
          <Home className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          Voltar ao site
        </button>

        {/* Logo/Brand */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/ebbing-logo.png?v=1" alt="Logo Ebbing" className="h-16 mb-2 object-contain" />
          <p className="text-muted">Plataforma de Revisão Espaçada</p>
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
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1.5"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light" />
                    <input
                      id="email"
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
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-navy uppercase tracking-wide"
                    >
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot-password');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-sky hover:text-sky-dark transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light" />
                    <input
                      id="password"
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
                  onMouseEnter={(e) =>
                    !isLoading &&
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e6b000')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFC72C')
                  }
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-[#e2e8f0] text-center">
                <p className="text-muted text-sm">
                  Ainda não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-sky hover:text-sky-dark font-semibold transition-colors"
                  >
                    Criar conta grátis
                  </button>
                </p>
              </div>
            </>
          ) : mode === 'signup' ? (
            <>
              <button
                onClick={() => switchMode('login')}
                className="flex items-center gap-2 text-muted hover:text-navy transition-colors mb-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </button>

              <h2 className="text-xl font-bold text-navy mb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Criar conta
              </h2>
              <p className="text-muted text-sm mb-6">
                Cadastre-se com seu e-mail. Você receberá um link de confirmação para ativar a
                conta.
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1.5"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light" />
                    <input
                      id="signup-email"
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
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1.5"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light" />
                    <input
                      id="signup-password"
                      type="password"
                      required
                      name="new-password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-alt border border-[#e2e8f0] rounded-xl py-2.5 pl-11 pr-4 text-navy placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-sky/40 transition-all"
                      placeholder="Mínimo 8 caracteres, letras e números"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-confirm"
                    className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1.5"
                  >
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light" />
                    <input
                      id="signup-confirm"
                      type="password"
                      required
                      name="confirm-password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {isLoading ? 'Enviando...' : 'Criar conta'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
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
                  <label
                    htmlFor="recover-email"
                    className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1.5"
                  >
                    E-mail cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light" />
                    <input
                      id="recover-email"
                      type="email"
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
