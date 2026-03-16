import type { Subject } from '../types';

interface AgendaProps {
  subjects: Subject[];
}

export function Agenda({ subjects }: AgendaProps) {
  const sorted = [...subjects]
    .filter((s): s is Subject & { nextReviewDate: string } => !!s.nextReviewDate)
    .sort((a, b) => (a.nextReviewDate > b.nextReviewDate ? 1 : -1));

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">
      <h2 className="text-3xl font-black text-white uppercase tracking-tight">Próximas Revisões</h2>
      
      <div className="space-y-4">
        {sorted.map((s) => (
          <div key={s.id} className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
            <div>
              <p className="text-white font-bold mb-0.5">{s.aulaPrincipal}</p>
              <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">{s.area} • {s.modulo}</p>
            </div>
            <div className="text-right">
              <p className="text-white text-sm font-bold">{s.nextReviewDate}</p>
              <p className="text-white/20 text-[10px] uppercase font-black tracking-tighter">Agendado</p>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-32">
            <p className="text-white/10 text-xs font-black uppercase tracking-[0.3em]">Nenhuma revisão agendada</p>
          </div>
        )}
      </div>
    </div>
  );
}
