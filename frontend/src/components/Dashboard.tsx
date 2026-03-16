import { Pomodoro } from './Pomodoro';
import type { Subject } from '../types';
import { today } from '../services/algorithm';

interface DashboardProps {
  subjects: Subject[];
  onNavigateCronograma: () => void;
}

export function Dashboard({ subjects, onNavigateCronograma }: DashboardProps) {
  const todayISO = today();

  const dueToday = subjects.filter((s) => s.nextReviewDate === todayISO);
  const overdue  = subjects.filter(
    (s) => s.nextReviewDate && s.nextReviewDate < todayISO && s.currentStage !== 'concluido',
  );
  const completed  = subjects.filter((s) => s.currentStage === 'concluido');
  const notStarted = subjects.filter((s) => s.currentStage === 'aula');

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Welcome */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy mb-3">Bem-vindo(a)!</h2>
          <p className="text-muted text-sm leading-relaxed">
            Esse é o seu Planner de Revisão Espaçada! Utilize-o para organizar
            seus estudos e todas as revisões durante o ano.
          </p>
          <p className="text-center font-semibold text-navy mt-4 text-sm">
            <span className="text-yellow-500">★</span> Constância e estratégia!
          </p>
        </div>

        {/* Pomodoro */}
        <Pomodoro />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Para Hoje"    value={dueToday.length}  color="text-[#FFC72C]"  bg="bg-yellow-50 border-yellow-200"  onClick={onNavigateCronograma} />
        <StatCard label="Atrasados"    value={overdue.length}   color="text-red-500"    bg="bg-red-50 border-red-200"        onClick={onNavigateCronograma} />
        <StatCard label="Concluídos"   value={completed.length} color="text-green-600"  bg="bg-green-50 border-green-200" />
        <StatCard label="Não iniciados" value={notStarted.length} color="text-muted"   bg="bg-white border-[#e2e8f0]"      onClick={onNavigateCronograma} />
      </div>

      {/* Due today list */}
      {dueToday.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
            <span className="text-yellow-500">⚡</span> Revisões de Hoje ({dueToday.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dueToday.map((s) => (
              <div
                key={s.id}
                className="bg-surface border border-[#e2e8f0] rounded-xl p-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-light">{s.modulo}</div>
                  <div className="text-sm text-navy font-medium truncate">{s.aulaPrincipal}</div>
                </div>
                {s.relevancia === 'Alta' ? (
                  <span className="badge-alta shrink-0">Alta</span>
                ) : s.relevancia === 'Média' ? (
                  <span className="badge-media shrink-0">Média</span>
                ) : (
                  <span className="badge-baixa shrink-0">Baixa</span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={onNavigateCronograma}
            className="mt-4 text-xs text-sky font-medium hover:text-sky-dark transition-colors"
          >
            Ver no Cronograma →
          </button>
        </div>
      )}

      {overdue.length > 0 && dueToday.length === 0 && (
        <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
          <p className="text-sm text-red-600">
            🚨 Você tem <strong>{overdue.length}</strong> revisão(ões) atrasada(s).{' '}
            <button onClick={onNavigateCronograma} className="underline hover:text-red-700">
              Ver no Cronograma
            </button>
          </p>
        </div>
      )}

      {dueToday.length === 0 && overdue.length === 0 && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-5 text-center">
          <p className="text-sm text-green-700">
            ✅ Nenhuma revisão pendente para hoje. Bom trabalho!
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, color, bg, onClick,
}: {
  label: string; value: number; color: string; bg: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-2xl p-4 shadow-sm ${bg} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    >
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}
