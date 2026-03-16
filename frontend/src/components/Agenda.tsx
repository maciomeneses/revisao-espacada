import type { Subject } from '../types';

interface AgendaProps {
  subjects: Subject[];
}

export function Agenda({ subjects }: AgendaProps) {
  const sorted = [...subjects]
    .filter(s => s.nextReviewDate)
    .sort((a, b) => (a.nextReviewDate! > b.nextReviewDate! ? 1 : -1));

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">
      <h2 className="text-3xl font-black text-white">Próximas Revisões</h2>
      
      <div className="space-y-4">
        {sorted.map((s) => (
          <div key={s.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-white font-bold">{s.aulaPrincipal}</p>
              <p className="text-white/40 text-[10px] uppercase font-black">{s.area} • {s.modulo}</p>
            </div>
            <div className="text-right">
              <p className="text-white text-xs font-bold">{s.nextReviewDate}</p>
              <p className="text-white/20 text-[10px] uppercase font-black">Agendado</p>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-20 text-white/20 font-black uppercase tracking-widest">
            Nenhuma revisão agendada
          </div>
        )}
      </div>
    </div>
  );
}
