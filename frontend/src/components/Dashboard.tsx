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
  const overdue = subjects.filter(
    (s) => s.nextReviewDate && s.nextReviewDate < todayISO && s.currentStage !== 'concluido',
  );
  const completed = subjects.filter((s) => s.currentStage === 'concluido');
  const notStarted = subjects.filter((s) => s.currentStage === 'aula');

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Welcome */}
        <div className="bg-[#1e1b10] border border-[#3a3520] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">Bem-vindo(a)!</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Esse é o seu Planner de Revisão Espaçada! Utilize-o para organizar
            seus estudos e todas as revisões durante o ano.
          </p>
          <p className="text-center font-semibold text-yellow-400 mt-4 text-sm">
            Constância e estratégia!
          </p>
        </div>

        {/* Pomodoro */}
        <Pomodoro />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Para Hoje"
          value={dueToday.length}
          color="text-yellow-400"
          bg="bg-yellow-400/5 border-yellow-400/20"
          onClick={onNavigateCronograma}
        />
        <StatCard
          label="Atrasados"
          value={overdue.length}
          color="text-red-400"
          bg="bg-red-400/5 border-red-400/20"
          onClick={onNavigateCronograma}
        />
        <StatCard
          label="Concluídos"
          value={completed.length}
          color="text-green-400"
          bg="bg-green-400/5 border-green-400/20"
        />
        <StatCard
          label="Não iniciados"
          value={notStarted.length}
          color="text-gray-400"
          bg="bg-gray-400/5 border-gray-400/20"
          onClick={onNavigateCronograma}
        />
      </div>

      {/* Due today list */}
      {dueToday.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-yellow-400">⚡</span> Revisões de Hoje ({dueToday.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dueToday.map((s) => (
              <div
                key={s.id}
                className="bg-[#222] border border-[#333] rounded-lg p-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">{s.modulo}</div>
                  <div className="text-sm text-white truncate">{s.aulaPrincipal}</div>
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
            className="mt-4 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Ver no Cronograma →
          </button>
        </div>
      )}

      {overdue.length > 0 && dueToday.length === 0 && (
        <div className="bg-[#1a1a1a] rounded-xl border border-red-500/20 p-5">
          <p className="text-sm text-red-400">
            🚨 Você tem <strong>{overdue.length}</strong> revisão(ões) atrasada(s).{' '}
            <button onClick={onNavigateCronograma} className="underline hover:text-red-300">
              Ver no Cronograma
            </button>
          </p>
        </div>
      )}

      {dueToday.length === 0 && overdue.length === 0 && (
        <div className="bg-[#1a1a1a] rounded-xl border border-green-500/20 p-5 text-center">
          <p className="text-sm text-green-400">
            ✅ Nenhuma revisão pendente para hoje. Bom trabalho!
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  bg,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-xl p-4 ${bg} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    >
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
