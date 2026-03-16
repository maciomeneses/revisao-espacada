import { useState } from 'react';
import type { Subject } from '../types';

interface CronogramaProps {
  subjects: Subject[];
  onToggleAula: (id: string) => void;
  onTogglePreAula: (id: string) => void;
  onToggleFlashcards: (id: string) => void;
  onRegisterReview: (id: string, numCorrect: number) => void;
  onResetCiclo: (id: string) => void;
  onRevertStage: (id: string) => void;
}

export function Cronograma({
  subjects,
  onToggleAula,
  onTogglePreAula,
  onToggleFlashcards,
  onRegisterReview,
  onResetCiclo,
  onRevertStage,
}: CronogramaProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [numCorrect, setNumCorrect] = useState(7);

  const handleReview = () => {
    if (selectedSubjectId) {
      onRegisterReview(selectedSubjectId, numCorrect);
      setSelectedSubjectId(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const pending = subjects.filter(s => !s.nextReviewDate || s.nextReviewDate <= today);

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-white">Cronograma</h2>
        <span className="text-white/40 text-xs font-bold uppercase tracking-widest bg-white/5 py-1 px-3 rounded-full">
          FSRS v6 ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {subjects.map((s) => (
          <div key={s.id} className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black bg-white/10 text-white/50 px-2 py-0.5 rounded uppercase">{s.area}</span>
                <span className="text-[10px] font-black bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded uppercase">{s.relevancia}</span>
              </div>
              <h3 className="text-xl font-black text-white mb-1">{s.aulaPrincipal}</h3>
              <p className="text-white/40 text-xs font-bold uppercase mb-4">{s.modulo}</p>
              
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-white/30 text-[10px] font-black uppercase mb-1">Estabilidade</span>
                  <span className="text-white text-xs font-bold">{s.stability ? `${s.stability.toFixed(1)} dias` : 'Iniciante'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/30 text-[10px] font-black uppercase mb-1">Próxima Revisão</span>
                  <span className={`text-xs font-bold ${s.nextReviewDate && s.nextReviewDate <= today ? 'text-orange-400' : 'text-white'}`}>
                    {s.nextReviewDate || 'A definir'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => onToggleAula(s.id)}
                className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all ${s.aulaAssistida ? 'bg-green-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                Aula
              </button>
              <button 
                onClick={() => onTogglePreAula(s.id)}
                className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all ${s.preAulaFeita ? 'bg-green-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                Pré-Aula
              </button>
              <button 
                onClick={() => onToggleFlashcards(s.id)}
                className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all ${s.flashcardsFeitos ? 'bg-green-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                Cards
              </button>
              
              <button
                onClick={() => setSelectedSubjectId(s.id)}
                className="bg-white text-black py-2 px-6 rounded-full text-[10px] font-black uppercase hover:scale-105 transition-transform"
              >
                REVISAR
              </button>

              <div className="relative group/menu">
                <button className="p-2 text-white/20 hover:text-white transition-colors">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                </button>
                <div className="absolute right-0 top-full mt-2 w-40 bg-[#2a2a2a] border border-white/10 rounded-xl hidden group-hover/menu:block z-20 shadow-2xl">
                  <button onClick={() => onResetCiclo(s.id)} className="w-full text-left px-4 py-3 text-[10px] font-black text-white hover:bg-white/5 rounded-t-xl uppercase">Resetar Ciclo</button>
                  <button onClick={() => onRevertStage(s.id)} className="w-full text-left px-4 py-3 text-[10px] font-black text-white hover:bg-white/5 rounded-b-xl uppercase border-t border-white/5">Reverter Estabilidade</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedSubjectId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Registro de Bloco</h4>
            <p className="text-white/40 text-xs font-bold uppercase mb-8">Bloco de 10 questões</p>
            
            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-white/60 text-[10px] font-black uppercase">Acertos</span>
                <span className="text-4xl font-black text-white">{numCorrect}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={numCorrect}
                onChange={(e) => setNumCorrect(parseInt(e.target.value))}
                className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] font-black text-white/30 uppercase">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setSelectedSubjectId(null)}
                className="flex-1 py-4 text-white/50 text-[10px] font-black uppercase hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleReview}
                className="flex-1 bg-white text-black py-4 rounded-full text-[10px] font-black uppercase hover:scale-105 transition-transform"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
