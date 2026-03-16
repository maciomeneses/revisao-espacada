import type { Subject } from '../types';

interface DashboardProps {
  subjects: Subject[];
  onNavigateCronograma: () => void;
}

export function Dashboard({ subjects, onNavigateCronograma }: DashboardProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const stats = {
    total: subjects.length,
    today: subjects.filter((s) => s.nextReviewDate && s.nextReviewDate <= todayStr).length,
    memorized: subjects.filter((s) => (s.stability || 0) > 30).length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total de Matérias', value: stats.total, color: 'text-white' },
          { label: 'Revisões para Hoje', value: stats.today, color: 'text-orange-400' },
          { label: 'Conhecimento Estável', value: stats.memorized, color: 'text-green-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 shadow-xl">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="text-9xl font-black text-white">FSRS</span>
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl font-black text-white mb-4 leading-tight uppercase tracking-tight">
            Seu progresso é guiado por ciência.
          </h2>
          <p className="text-white/60 mb-8 leading-relaxed font-medium">
            Utilizamos o algoritmo FSRS v6 para calcular a retenção ideal de cada tema, otimizando seu tempo de estudo de forma dinâmica.
          </p>
          <button
            onClick={onNavigateCronograma}
            className="bg-white text-black font-black py-4 px-8 rounded-full text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl shadow-white/10"
          >
            IR PARA O CRONOGRAMA
          </button>
        </div>
      </div>
    </div>
  );
}
