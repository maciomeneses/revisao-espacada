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
      <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Próximas Revisões</h2>
      
      <div className="space-y-3">
        {sorted.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-2xl border border-border flex items-center justify-between group hover:border-navy/20 transition-colors shadow-sm">
            <div>
              <p className="text-navy font-bold mb-0.5">{s.aulaPrincipal}</p>
              <p className="text-muted text-[10px] uppercase font-black tracking-widest">{s.area} • {s.modulo}</p>
            </div>
            <div className="text-right">
              <p className="text-navy text-sm font-bold">{s.nextReviewDate}</p>
              <p className="text-muted-light text-[9px] uppercase font-black tracking-tighter">Agendado</p>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-border">
            <p className="text-muted-light text-xs font-black uppercase tracking-[0.3em]">Nenhuma revisão agendada</p>
          </div>
        )}
      </div>
    </div>
  );
}
