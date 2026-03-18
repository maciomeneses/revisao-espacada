import { useMemo } from 'react';
import type { Subject } from '../types';
import { localDateStr } from '../services/algorithm';

interface DashboardProps {
  subjects: Subject[];
  onNavigateCronograma: () => void;
}

export function Dashboard({ subjects, onNavigateCronograma }: DashboardProps) {
  const todayStr = localDateStr(new Date());

  /**
   * Memoiza as estatísticas do dashboard para evitar recalcular a cada re-render
   * enquanto a lista de subjects não mudar.
   */
  const stats = useMemo(() => ({
    total: subjects.length,
    today: subjects.filter((s) => s.nextReviewDate && s.nextReviewDate <= todayStr).length,
    memorized: subjects.filter((s) => (s.stability || 0) > 30).length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [subjects]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total de Matérias', value: stats.total, color: 'text-navy' },
          { label: 'Revisões para Hoje', value: stats.today, color: 'text-yellow-dark' },
          { label: 'Conhecimento Estável', value: stats.memorized, color: 'text-green-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <p className="text-muted-light text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 border border-border relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <span className="text-9xl font-black text-navy">FSRS</span>
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl font-black text-navy mb-4 leading-tight uppercase tracking-tight">
            Seu progresso é guiado por ciência.
          </h2>
          <p className="text-muted mb-8 leading-relaxed font-medium">
            Utilizamos o algoritmo FSRS v6 para calcular a retenção ideal de cada tema, otimizando seu tempo de estudo de forma dinâmica e personalizada.
          </p>
          <button
            onClick={onNavigateCronograma}
            className="bg-navy text-white font-black py-4 px-10 rounded-full text-[10px] uppercase tracking-widest hover:bg-navy-light transition-all shadow-md active:scale-95"
          >
            IR PARA O CRONOGRAMA
          </button>
        </div>
      </div>
    </div>
  );
}
