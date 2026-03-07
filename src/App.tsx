import { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Cronograma } from './components/Cronograma';
import { Agenda } from './components/Agenda';
import { EspiaoEstrategico } from './components/EspiaoEstrategico';
import { useSubjects } from './hooks/useSubjects';
import type { ActiveView } from './types';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView | 'dashboard'>('dashboard');
  const { subjects, toggleAula, togglePreAula, toggleFlashcards, registerReview, doResetCiclo } =
    useSubjects();

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header
        activeView={activeView === 'dashboard' ? 'cronograma' : activeView}
        onViewChange={(v) => setActiveView(v)}
      />

      {/* Hero banner — only on dashboard */}
      {activeView === 'dashboard' && (
        <div
          className="relative w-full h-40 md:h-52 overflow-hidden shrink-0"
          style={{
            background: 'linear-gradient(to bottom, #1a2a3a, #0f0f0f)',
          }}
        >
          <div className="absolute inset-0 flex items-end px-6 pb-5">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              RevisaENEM
            </h1>
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
      </main>
    </div>
  );
}
