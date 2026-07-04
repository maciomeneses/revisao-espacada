import { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Cronograma } from './components/Cronograma';
import { EspiaoEstrategico } from './components/EspiaoEstrategico';
import { GerenciarConteudo } from './components/GerenciarConteudo';
import { ErrorToast } from './components/ErrorToast';
import { AuthScreen } from './components/Auth/AuthScreen';
import { ResetPasswordScreen } from './components/Auth/ResetPasswordScreen';
import { VerifyEmailScreen } from './components/Auth/VerifyEmailScreen';
import { LandingPage } from './components/LandingPage';
import { AdminArea } from './components/Admin/AdminArea';
import { Provas } from './components/Provas';
import { GerenciarCategorias } from './pages/GerenciarCategorias';
import { useSubjects } from './hooks/useSubjects';
import { useRoutine } from './hooks/useRoutine';
import { useReviewPreferences } from './hooks/useReviewPreferences';
import { clearSubjects, clearRoutine } from './services/storage';
import type { ActiveView, Role } from './types';

/** Extrai o valor do query param ?token= da URL atual. */
function getResetTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

/** Extrai o valor do query param ?verify= (link de confirmação de e-mail do signup). */
function getVerifyTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('verify');
}

export function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<Role | undefined>();
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    try {
      const s = localStorage.getItem('ebbing_session');
      return s ? ((JSON.parse(s).email as string | null) ?? null) : null;
    } catch {
      return null;
    }
  });
  const [showGerenciar, setShowGerenciar] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(() => getResetTokenFromUrl());
  const [verifyToken, setVerifyToken] = useState<string | null>(() => getVerifyTokenFromUrl());
  const [highlightedSubjectId, setHighlightedSubjectId] = useState<string | undefined>();

  const location = useLocation();
  const navigate = useNavigate();

  const { routine, addSlot, updateSlot, removeSlot } = useRoutine(userEmail);
  const { allowedDays, toggleDay, maxReviewsPerDay, setMaxReviewsPerDay } =
    useReviewPreferences(userEmail);

  const {
    subjects,
    reviewEvents,
    error: subjectsError,
    clearError: clearSubjectsError,
    toggleAula,
    registerReview,
    registerFixacao,
    doResetCiclo,
    addSubject,
    removeSubject,
    revertStage,
    rescheduleByRoutine,
  } = useSubjects(routine, userEmail ?? undefined, allowedDays, maxReviewsPerDay);

  const handleAddSlot = useCallback(
    (slot: Parameters<typeof addSlot>[0]) => {
      addSlot(slot);
      rescheduleByRoutine([...routine, { ...slot, id: '__snap__' }]);
    },
    [addSlot, rescheduleByRoutine, routine],
  );

  const availableAreas = useMemo(
    () => [...new Set(subjects.map((s) => s.area).filter(Boolean))].sort(),
    [subjects],
  );

  useEffect(() => {
    const session = localStorage.getItem('ebbing_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.token) {
          setIsAuthenticated(true);
          setUserRole(parsed.role);
        }
      } catch {
        localStorage.removeItem('ebbing_session');
      }
    }
  }, []);

  const handleLogin = (email: string, token: string, role: string) => {
    localStorage.setItem(
      'ebbing_session',
      JSON.stringify({ email, token, role, timestamp: Date.now() }),
    );
    setIsAuthenticated(true);
    setUserRole(role as Role);
    setUserEmail(email);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    const session = localStorage.getItem('ebbing_session');
    const email = session ? (JSON.parse(session).email as string | undefined) : undefined;
    localStorage.removeItem('ebbing_session');
    clearSubjects(email);
    clearRoutine(email);
    setIsAuthenticated(false);
    setUserRole(undefined);
    setUserEmail(null);
    navigate('/');
  };

  const handleResetSuccess = () => {
    const session = localStorage.getItem('ebbing_session');
    const email = session ? (JSON.parse(session).email as string | undefined) : undefined;
    localStorage.removeItem('ebbing_session');
    clearSubjects(email);
    clearRoutine(email);
    setIsAuthenticated(false);
    setUserRole(undefined);
    setResetToken(null);
    window.history.replaceState({}, '', window.location.pathname);
    navigate('/login');
  };

  if (resetToken) {
    return <ResetPasswordScreen token={resetToken} onSuccess={handleResetSuccess} />;
  }

  if (verifyToken) {
    return (
      <VerifyEmailScreen
        token={verifyToken}
        onVerified={(email, token, role) => {
          setVerifyToken(null);
          window.history.replaceState({}, '', window.location.pathname);
          handleLogin(email, token, role);
        }}
        onBackToLogin={() => {
          setVerifyToken(null);
          window.history.replaceState({}, '', window.location.pathname);
          navigate('/login');
        }}
      />
    );
  }

  const isLogin = location.pathname === '/login';

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {isAuthenticated && !isLogin && location.pathname !== '/' && (
        <Header
          activeView={location.pathname.substring(1) as ActiveView}
          userRole={userRole}
          onViewChange={(v) => navigate(`/${v}`)}
          onOpenGerenciar={() => setShowGerenciar(true)}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1 overflow-hidden flex flex-col pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthScreen onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <div className="flex-1 overflow-y-auto flex flex-col">
                  <div
                    className="relative w-full h-36 md:h-44 overflow-hidden shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #1F3A5F 0%, #2a4d7a 60%, #4FA3D1 100%)',
                    }}
                  >
                    <div className="absolute inset-0 flex items-end px-6 pb-5">
                      <div>
                        <img
                          src="/ebbing-logo.png?v=1"
                          alt="Logo Ebbing"
                          className="h-10 bg-white/10 backdrop-blur-md p-2 rounded-xl mb-3 object-contain"
                        />
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
                          Plataforma de Revisão Espaçada
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <Dashboard
                      subjects={subjects}
                      onNavigateCronograma={(subjectId?: string) => {
                        setHighlightedSubjectId(subjectId);
                        navigate('/cronograma');
                      }}
                      onRegisterReview={registerReview}
                      routine={routine}
                      availableAreas={availableAreas}
                      onAddSlot={handleAddSlot}
                      onUpdateSlot={updateSlot}
                      onRemoveSlot={removeSlot}
                      allowedDays={allowedDays}
                      onToggleDay={toggleDay}
                      maxReviewsPerDay={maxReviewsPerDay}
                      onSetMaxReviewsPerDay={setMaxReviewsPerDay}
                    />
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/cronograma"
            element={
              isAuthenticated ? (
                <Cronograma
                  subjects={subjects}
                  onToggleAula={toggleAula}
                  onRegisterReview={registerReview}
                  onRegisterFixacao={registerFixacao}
                  onResetCiclo={doResetCiclo}
                  onRevertStage={revertStage}
                  highlightedSubjectId={highlightedSubjectId}
                  onHighlightCleared={() => setHighlightedSubjectId(undefined)}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/espiao"
            element={
              isAuthenticated ? (
                <div className="flex-1 overflow-hidden">
                  <EspiaoEstrategico subjects={subjects} reviewEvents={reviewEvents} />
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/provas"
            element={
              isAuthenticated ? (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <Provas />
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/categorias"
            element={
              isAuthenticated ? (
                <GerenciarCategorias subjects={subjects} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/admin"
            element={
              isAuthenticated && userRole === 'ADMIN' ? (
                <AdminArea />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* Catch-all: vai para a Landing Page se a rota não existir */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {showGerenciar && (
        <GerenciarConteudo
          subjects={subjects}
          onAdd={addSubject}
          onRemove={removeSubject}
          onClose={() => setShowGerenciar(false)}
        />
      )}

      <ErrorToast message={subjectsError} onDismiss={clearSubjectsError} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
