import React, { useState } from 'react';
import { LogIn, Mail, Lock, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface AuthScreenProps {
  onLogin: (email: string, token: string) => void;
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

    try {
      const res = await api.auth.login(email, password);
      onLogin(res.email, res.token);
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
    setIsLoading(true);

    try {
      // Simulação — backend ainda não tem endpoint de recuperação de senha
      await new Promise(resolve => setTimeout(resolve, 800));
      if (email) {
        setSuccessMessage('As instruções para redefinir sua senha foram enviadas para o seu e-mail.');
      } else {
        setError('Por favor, insira seu e-mail.');
      }
    } catch {
      setError('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 mb-4 border border-blue-500/30">
            <KeyRound className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Ebbin</h1>
          <p className="text-gray-400 mt-2">Plataforma de Revisão Espaçada</p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-2xl">
          {mode === 'login' ? (
            <>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Acesse sua conta
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-400">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot-password');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-gray-500 text-sm">
                  O cadastro de novos usuários é realizado apenas por administradores.
                </p>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </button>

              <h2 className="text-xl font-bold text-white mb-2">Recuperar senha</h2>
              <p className="text-gray-400 text-sm mb-6">
                Informe o seu e-mail para receber as instruções de recuperação.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    E-mail cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-400">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !!successMessage}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-4"
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
