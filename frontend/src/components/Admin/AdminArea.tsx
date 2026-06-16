import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Shield,
  Search,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  X,
  Settings,
} from 'lucide-react';
import { api } from '../../services/api';
import { User, Role } from '../../types';

export function AdminArea() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'USER' as Role,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.admin.users.list();
      setUsers(data);
    } catch {
      setError('Falha ao carregar usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        role: 'USER',
      });
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingUser) {
        await api.admin.users.update(editingUser.id!, {
          ...formData,
          password: formData.password || undefined,
        });
        setSuccess('Usuário atualizado com sucesso!');
      } else {
        if (!formData.password) {
          setError('Senha é obrigatória para novos usuários.');
          return;
        }
        await api.admin.users.create(formData);
        setSuccess('Usuário criado com sucesso!');
      }
      setIsModalOpen(false);
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar solicitação.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.admin.users.delete(id);
      setSuccess('Usuário removido.');
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Erro ao excluir usuário.');
    }
  };

  const filteredUsers = useMemo(
    () => users.filter((u) => u.email.toLowerCase().includes(searchTerm.toLowerCase())),
    [users, searchTerm],
  );

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      users: users.filter((u) => u.role === 'USER').length,
    }),
    [users],
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <h2 className="text-2xl font-black text-navy uppercase tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-yellow" />
            Administração
          </h2>
          <p className="text-muted-light text-[10px] font-black uppercase tracking-widest">
            Controle de Acesso e Usuários
          </p>
        </div>

        <div className="bg-white border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-navy/5 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-navy" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-light uppercase tracking-widest">
              Total
            </p>
            <p className="text-xl font-bold text-navy">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-yellow/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-light uppercase tracking-widest">
              Admins
            </p>
            <p className="text-xl font-bold text-navy">{stats.admins}</p>
          </div>
        </div>

        <div className="bg-white border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <button
            onClick={() => handleOpenModal()}
            className="w-full h-full flex items-center justify-center gap-2 bg-navy text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-navy-light transition-all shadow-md group"
          >
            <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Novo Usuário
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface-alt/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-light" />
            <input
              type="text"
              placeholder="Buscar por e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/5 transition-all"
            />
          </div>

          {(success || error) && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                success
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}
            >
              {success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {success || error}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-alt/50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-muted-light uppercase tracking-widest">
                  Usuário
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-muted-light uppercase tracking-widest">
                  Perfil
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-muted-light uppercase tracking-widest">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-muted text-sm">
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-muted text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            user.role === 'ADMIN' ? 'bg-yellow text-navy' : 'bg-navy/5 text-navy'
                          }`}
                        >
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-navy">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          user.role === 'ADMIN'
                            ? 'bg-yellow/10 text-yellow-700 border border-yellow-200'
                            : 'bg-navy/5 text-navy/60 border border-navy/10'
                        }`}
                      >
                        {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-muted-light hover:text-navy hover:bg-navy/5 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id!)}
                          className="p-2 text-muted-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-[300] flex items-center justify-center p-6">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden border border-border animate-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface-alt/30">
              <h3 className="font-black text-navy uppercase tracking-tight flex items-center gap-2">
                {editingUser ? (
                  <Edit2 className="w-4 h-4 text-yellow" />
                ) : (
                  <UserPlus className="w-4 h-4 text-yellow" />
                )}
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-muted-light hover:text-navy transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-light uppercase tracking-widest ml-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-light" />
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-surface border border-border rounded-xl px-12 py-3 text-sm focus:border-navy/20 focus:outline-none transition-all"
                      placeholder="usuario@ebbing.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-light uppercase tracking-widest ml-1">
                    Senha {editingUser && '(deixe em branco para manter)'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-light" />
                    <input
                      required={!editingUser}
                      type="password"
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-surface border border-border rounded-xl px-12 py-3 text-sm focus:border-navy/20 focus:outline-none transition-all"
                      placeholder="••••••••"
                      aria-describedby="password-hint"
                    />
                  </div>
                  {formData.password.length > 0 && formData.password.length < 6 && (
                    <p
                      id="password-hint"
                      className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />A senha deve ter pelo menos 6 caracteres
                    </p>
                  )}
                  {!editingUser && formData.password.length === 0 && (
                    <p id="password-hint" className="text-[10px] text-muted-light ml-1">
                      Mínimo de 6 caracteres
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-light uppercase tracking-widest ml-1">
                    Perfil de Acesso
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'USER' })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.role === 'USER'
                          ? 'bg-navy text-white border-navy shadow-lg'
                          : 'bg-white text-muted-light border-border hover:border-navy/20'
                      }`}
                    >
                      Usuário Comum
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                        formData.role === 'ADMIN'
                          ? 'bg-yellow text-navy border-yellow shadow-lg'
                          : 'bg-white text-muted-light border-border hover:border-navy/20'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      Administrador
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-navy text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-navy-light transition-all shadow-xl active:scale-95"
              >
                {editingUser ? 'SALVAR ALTERAÇÕES' : 'CRIAR USUÁRIO'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
