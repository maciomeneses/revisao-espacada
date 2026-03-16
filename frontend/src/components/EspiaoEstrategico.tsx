import type { Subject } from '../types';

interface EspiaoEstrategicoProps {
  subjects: Subject[];
}

export function EspiaoEstrategico({ subjects }: EspiaoEstrategicoProps) {
  const subjectsWithStability = subjects.filter(s => (s.stability || 0) > 0);
  const avgStability = subjectsWithStability.length > 0 
    ? subjectsWithStability.reduce((acc, s) => acc + (s.stability || 0), 0) / subjectsWithStability.length 
    : 0;
  
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Espião Estratégico</h2>
        <div className="text-right">
          <p className="text-muted-light text-[10px] font-black uppercase tracking-widest">Média de Estabilidade</p>
          <p className="text-2xl font-black text-green-600">{avgStability.toFixed(1)} dias</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-6 py-5 text-[10px] font-black text-navy/40 uppercase tracking-widest">Matéria</th>
                <th className="px-6 py-5 text-[10px] font-black text-navy/40 uppercase tracking-widest">Performance</th>
                <th className="px-6 py-5 text-[10px] font-black text-navy/40 uppercase tracking-widest text-center">Estabilidade</th>
                <th className="px-6 py-5 text-[10px] font-black text-navy/40 uppercase tracking-widest text-center">Dificuldade</th>
                <th className="px-6 py-5 text-[10px] font-black text-navy/40 uppercase tracking-widest text-right">Reps</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className="border-b border-border hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-navy mb-0.5">{s.aulaPrincipal}</p>
                    <p className="text-[10px] text-muted-light uppercase font-black tracking-widest">{s.area}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      s.performanceLevel === 'excelente' ? 'bg-green-50 text-green-600 border-green-200' :
                      s.performanceLevel === 'bom' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      s.performanceLevel === 'medio' ? 'bg-yellow/10 text-yellow-dark border-yellow-200' :
                      s.performanceLevel === 'ruim' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-surface text-muted-light border-border'
                    }`}>
                      {s.performanceLevel === 'nao_classificada' ? 'N/A' : s.performanceLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-navy">{s.stability ? `${s.stability.toFixed(1)}d` : '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-navy">{s.difficulty ? s.difficulty.toFixed(1) : '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-black text-muted-light">{s.reps || 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
