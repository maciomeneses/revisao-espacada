import type { Subject } from '../types';

interface EspiaoEstrategicoProps {
  subjects: Subject[];
}

export function EspiaoEstrategico({ subjects }: EspiaoEstrategicoProps) {
  const avgStability = subjects.reduce((acc, s) => acc + (s.stability || 0), 0) / (subjects.length || 1);
  
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-white">Espião Estratégico</h2>
        <div className="text-right">
          <p className="text-white/40 text-[10px] font-black uppercase">Média de Estabilidade</p>
          <p className="text-2xl font-black text-green-400">{avgStability.toFixed(1)} dias</p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase">Matéria</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase">Performance</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase">Estabilidade</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase">Dificuldade</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase">Reps</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-white">{s.aulaPrincipal}</p>
                  <p className="text-[10px] text-white/30 uppercase font-black">{s.area}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                    s.performanceLevel === 'excelente' ? 'bg-green-500/20 text-green-400' :
                    s.performanceLevel === 'bom' ? 'bg-blue-500/20 text-blue-400' :
                    s.performanceLevel === 'medio' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {s.performanceLevel}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-white">
                  {s.stability ? `${s.stability.toFixed(1)}d` : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-white">
                  {s.difficulty ? s.difficulty.toFixed(1) : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-white/40">
                  {s.reps || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
