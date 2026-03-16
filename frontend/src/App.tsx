import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Cronograma } from './components/Cronograma';
import { Agenda } from './components/Agenda';
import { EspiaoEstrategico } from './components/EspiaoEstrategico';
import { GerenciarConteudo } from './components/GerenciarConteudo';
import { AuthScreen } from './components/Auth/AuthScreen';
import { AdminArea } from './components/Admin/AdminArea';
import { useSubjects } from './hooks/useSubjects';
import type { ActiveView, Role } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<Role | undefined>();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [showGerenciar, setShowGerenciar] = useState(false);

  const {
    subjects,
    toggleAula,
    togglePreAula,
    toggleFlashcards,
    registerReview,
    doResetCiclo,
    addSubject,
    removeSubject,
    revertStage,
  } = useSubjects();

  useEffect(() => {
    const session = localStorage.getItem('ebbin_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.token) {
          setIsAuthenticated(true);
          setUserRole(parsed.role);
        }
      } catch {
        localStorage.removeItem('ebbin_session');
      }
    }
  }, []);

  const handleLogin = (email: string, token: string, role: string) => {
    localStorage.setItem('ebbin_session', JSON.stringify({ email, token, role, timestamp: Date.now() }));
    setIsAuthenticated(true);
    setUserRole(role as Role);
  };

  const handleLogout = () => {
    localStorage.removeItem('ebbin_session');
    setIsAuthenticated(false);
    setUserRole(undefined);
    setActiveView('dashboard');
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header
        activeView={activeView}
        userRole={userRole}
        onViewChange={(v) => setActiveView(v)}
        onOpenGerenciar={() => setShowGerenciar(true)}
        onLogout={handleLogout}
      />

      {activeView === 'dashboard' && (
        <div
          className="relative w-full h-36 md:h-44 overflow-hidden shrink-0"
          style={{ background: 'linear-gradient(135deg, #1F3A5F 0%, #2a4d7a 60%, #4FA3D1 100%)' }}
        >
          <div className="absolute inset-0 flex items-end px-6 pb-5">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Ebbin</h1>
              <p className="text-white/70 text-sm mt-1">Plataforma de Revisão Espaçada</p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'dashboard' && (
          <div className="flex-1 overflow-y-auto">
            <Dashboard
              subjects={subjects}
              onNavigateCronograma={() => setActiveView('cronograma')}
            />
          </div>
        )}

        {activeView === 'cronograma' && (
          <Cronograma
            subjects={subjects}
            onToggleAula={toggleAula}
            onTogglePreAula={togglePreAula}
            onToggleFlashcards={toggleFlashcards}
            onRegisterReview={registerReview}
            onResetCiclo={doResetCiclo}
            onRevertStage={revertStage}
          />
        )}

        {activeView === 'agenda' && (
          <div className="flex-1 overflow-y-auto">
            <Agenda subjects={subjects} />
          </div>
        )}

        {activeView === 'espiao' && (
          <div className="flex-1 overflow-hidden">
            <EspiaoEstrategico subjects={subjects} />
          </div>
        )}

        {activeView === 'admin' && userRole === 'ADMIN' && (
          <AdminArea />
        )}
      </main>

      {showGerenciar && (
        <GerenciarConteudo
          subjects={subjects}
          onAdd={addSubject}
          onRemove={removeSubject}
          onClose={() => setShowGerenciar(false)}
        />
      )}
    </div>
  );
}
