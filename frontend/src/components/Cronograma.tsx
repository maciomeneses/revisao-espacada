import { useState } from 'react';
import type { Subject } from '../types';
import { getProximaTarefa, getFormulaStatus } from '../services/algorithm';

interface CronogramaProps {
  subjects: Subject[];
  onToggleAula: (id: string) => void;
  onTogglePreAula: (id: string) => void;
  onToggleFlashcards: (id: string) => void;
  onRegisterReview: (id: string, numCorrect: number) => void;
  onResetCiclo: (id: string) => void;
  onRevertStage: (id: string) => void;
}

interface ReviewForm {
  date: string;
  totalQuestions: number;
  numCorrect: number;
  timeMinutes: number;
}

const defaultForm = (): ReviewForm => ({
  date: new Date().toISOString().split('T')[0],
  totalQuestions: 10,
  numCorrect: 7,
  timeMinutes: 30,
});

export function Cronograma({
  subjects,
  onToggleAula,
  onTogglePreAula,
  onToggleFlashcards,
  onRegisterReview,
  onResetCiclo,
  onRevertStage,
}: CronogramaProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [form, setForm] = useState<ReviewForm>(defaultForm());

  const openReview = (subject: Subject) => {
    setSelectedSubject(subject);
    setForm(defaultForm());
  };

  const handleReview = () => {
    if (!selectedSubject) return;
    // Normaliza acertos para escala 0-10 usada pelo FSRS
    const normalized = Math.round((form.numCorrect / form.totalQuestions) * 10);
    onRegisterReview(selectedSubject.id, normalized);
    setSelectedSubject(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Cronograma</h2>
        <span className="text-muted text-[10px] font-black uppercase tracking-widest bg-white border border-border py-1 px-3 rounded-full">
          FSRS v6 ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {subjects.map((s) => (
          <div key={s.id} className="bg-white p-6 rounded-2xl border border-border flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold bg-navy text-white px-2 py-0.5 rounded uppercase tracking-wider">{s.area}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  s.relevancia === 'Alta' ? 'bg-red-600 text-white' :
                  s.relevancia === 'Média' ? 'bg-yellow text-navy' :
                  'bg-sky-500 text-white'
                }`}>{s.relevancia}</span>
                <span className="text-[10px] font-bold bg-surface text-navy/50 px-2 py-0.5 rounded uppercase tracking-wider">{getProximaTarefa(s.currentStage)}</span>
                {getFormulaStatus(s) && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    getFormulaStatus(s) === 'Atrasado' ? 'bg-red-100 text-red-600' :
                    getFormulaStatus(s) === 'Hoje' ? 'bg-yellow/20 text-yellow-dark' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {getFormulaStatus(s)}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-navy mb-0.5">{s.aulaPrincipal}</h3>
              <p className="text-muted text-[10px] font-bold uppercase tracking-widest">{s.modulo}</p>

              <div className="flex items-center gap-8 mt-4">
                <div className="flex flex-col">
                  <span className="text-muted-light text-[9px] font-black uppercase mb-0.5">Estabilidade</span>
                  <span className="text-navy text-xs font-bold">{s.stability ? `${s.stability.toFixed(1)} dias` : 'Iniciante'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-light text-[9px] font-black uppercase mb-0.5">Próxima Revisão</span>
                  <span className={`text-xs font-bold ${s.nextReviewDate && s.nextReviewDate <= todayStr ? 'text-red-600' : 'text-navy'}`}>
                    {s.nextReviewDate || 'A definir'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onTogglePreAula(s.id)}
                className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all border ${s.preAulaFeita ? 'bg-green-600 border-green-600 text-white' : 'bg-surface border-border text-muted hover:bg-white hover:text-navy'}`}
              >
                Pré-Aula
              </button>
              <button
                onClick={() => onToggleAula(s.id)}
                className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all border ${s.aulaAssistida ? 'bg-green-600 border-green-600 text-white' : 'bg-surface border-border text-muted hover:bg-white hover:text-navy'}`}
              >
                Aula
              </button>
              <button
                onClick={() => onToggleFlashcards(s.id)}
                className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all border ${s.flashcardsFeitos ? 'bg-green-600 border-green-600 text-white' : 'bg-surface border-border text-muted hover:bg-white hover:text-navy'}`}
              >
                Cards
              </button>

              <button
                onClick={() => openReview(s)}
                className="bg-navy text-white py-2 px-6 rounded-full text-[10px] font-black uppercase hover:bg-navy-light transition-all shadow-sm active:scale-95 ml-2"
              >
                REVISAR
              </button>

              <div className="relative group/menu ml-1">
                <button className="p-2 text-muted-light hover:text-navy transition-colors">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border rounded-xl hidden group-hover/menu:block z-20 shadow-xl py-1">
                  <button onClick={() => onResetCiclo(s.id)} className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-navy hover:bg-surface transition-colors uppercase">Resetar Ciclo</button>
                  <button onClick={() => onRevertStage(s.id)} className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-navy hover:bg-surface transition-colors uppercase border-t border-border">Reverter Estabilidade</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedSubject && (
        <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white border border-border rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h4 className="text-xl font-black text-navy mb-1 uppercase tracking-tight">Registro de Revisão</h4>
            <p className="text-muted text-[10px] font-bold uppercase mb-6 tracking-widest">
              {selectedSubject.area} — {selectedSubject.aulaPrincipal}
            </p>

            <div className="space-y-4">
              {/* Data e Tempo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-muted-light uppercase tracking-widest mb-1.5">
                    Data da revisão
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-muted-light uppercase tracking-widest mb-1.5">
                    Tempo gasto (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.timeMinutes}
                    onChange={(e) => setForm({ ...form, timeMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
              </div>

              {/* Total de questões e Acertos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-muted-light uppercase tracking-widest mb-1.5">
                    Nº de questões
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.totalQuestions}
                    onChange={(e) => {
                      const total = Math.max(1, parseInt(e.target.value) || 1);
                      setForm({ ...form, totalQuestions: total, numCorrect: Math.min(form.numCorrect, total) });
                    }}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-muted-light uppercase tracking-widest mb-1.5">
                    Acertos
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={form.totalQuestions}
                    value={form.numCorrect}
                    onChange={(e) => setForm({ ...form, numCorrect: Math.min(Math.max(0, parseInt(e.target.value) || 0), form.totalQuestions) })}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
              </div>

              {/* Barra de desempenho */}
              <div className="bg-surface rounded-2xl border border-border p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-muted-light uppercase tracking-widest">Aproveitamento</span>
                  <span className="text-2xl font-black text-navy">
                    {form.totalQuestions > 0 ? Math.round((form.numCorrect / form.totalQuestions) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${form.totalQuestions > 0 ? (form.numCorrect / form.totalQuestions) * 100 : 0}%`,
                      backgroundColor: form.totalQuestions > 0 && form.numCorrect / form.totalQuestions >= 0.8
                        ? '#16a34a'
                        : form.totalQuestions > 0 && form.numCorrect / form.totalQuestions >= 0.6
                        ? '#ca8a04'
                        : '#dc2626',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setSelectedSubject(null)}
                className="flex-1 py-4 text-muted text-[10px] font-black uppercase hover:text-navy transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReview}
                className="flex-1 bg-navy text-white py-4 rounded-full text-[10px] font-black uppercase hover:bg-navy-light transition-all shadow-md active:scale-95"
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
