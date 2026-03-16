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
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Espião Estratégico</h2>
        <div className="text-right">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Média de Estabilidade</p>
          <p className="text-2xl font-black text-green-400">{avgStability.toFixed(1)} dias</p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Matéria</th>
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Performance</th>
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Estabilidade</th>
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Dificuldade</th>
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Reps</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white mb-0.5">{s.aulaPrincipal}</p>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">{s.area}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      s.performanceLevel === 'excelente' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      s.performanceLevel === 'bom' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      s.performanceLevel === 'medio' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      s.performanceLevel === 'ruim' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-white/5 text-white/20'
                    }`}>
                      {s.performanceLevel === 'nao_classificada' ? 'N/A' : s.performanceLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-white">{s.stability ? `${s.stability.toFixed(1)}d` : '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-white">{s.difficulty ? s.difficulty.toFixed(1) : '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-black text-white/40">{s.reps || 0}</span>
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
