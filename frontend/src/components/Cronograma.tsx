import { useState, useMemo, useEffect, useRef } from 'react';
import type { Subject } from '../types';
import { getProximaTarefa, getFormulaStatus, localDateStr } from '../services/algorithm';

interface CronogramaProps {
  subjects: Subject[];
  onToggleAula: (id: string) => void;
  onRegisterReview: (id: string, numCorrect: number, totalQuestions: number, accuracy: number) => void;
  onRegisterFixacao: (id: string, numCorrect: number, totalQuestions: number, accuracy: number) => void;
  onResetCiclo: (id: string) => void;
  onRevertStage: (id: string) => void;
  /** ID do assunto a destacar e rolar até ele (vindo do Dashboard). */
  highlightedSubjectId?: string;
  /** Chamado assim que o highlight é consumido (para limpar no pai). */
  onHighlightCleared?: () => void;
}

interface ReviewForm {
  date: string;
  totalQuestions: string;
  numCorrect: number;
}

const defaultForm = (): ReviewForm => ({
  date: localDateStr(new Date()),
  totalQuestions: '10',
  numCorrect: 7,
});

export function Cronograma({
  subjects,
  onToggleAula,
  onRegisterReview,
  onRegisterFixacao,
  onResetCiclo,
  onRevertStage,
  highlightedSubjectId,
  onHighlightCleared,
}: CronogramaProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [modalMode, setModalMode] = useState<'review' | 'fixacao' | null>(null);
  const [form, setForm] = useState<ReviewForm>(defaultForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const areas = useMemo(() => {
    const set = new Set(subjects.map((s) => s.area).filter(Boolean));
    return Array.from(set).sort();
  }, [subjects]);

  // null = default to first area; '__all__' = show all
  const activeArea = selectedArea === '__all__' ? null : (selectedArea ?? areas[0] ?? null);
  const visibleSubjects = activeArea ? subjects.filter((s) => s.area === activeArea) : subjects;

  // Scroll to and flash a highlighted subject coming from the Dashboard
  useEffect(() => {
    if (!highlightedSubjectId) return;
    const target = subjects.find(s => s.id === highlightedSubjectId);
    if (!target) return;

    // 1. Make the subject visible — switch to its area (or show all)
    setSelectedArea(target.area ?? '__all__');

    // 2. After the area tab switch renders, scroll + flash
    const timer = setTimeout(() => {
      const el = cardRefs.current[highlightedSubjectId];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setFlashId(highlightedSubjectId);
      // Remove flash ring after animation
      setTimeout(() => {
        setFlashId(null);
        onHighlightCleared?.();
      }, 1800);
    }, 80);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedSubjectId]);

  const openModal = (subject: Subject, mode: 'review' | 'fixacao') => {
    setSelectedSubject(subject);
    setModalMode(mode);
    setForm(defaultForm());
    setFormError(null);
  };

  const closeModal = () => {
    setSelectedSubject(null);
    setModalMode(null);
  };

  const handleConfirm = () => {
    if (!selectedSubject || !modalMode) return;
    const total = parseInt(form.totalQuestions);
    if (!total || total <= 0) {
      setFormError('O número de questões deve ser maior que zero.');
      return;
    }
    if (form.numCorrect > total) {
      setFormError('Os acertos não podem ser maiores que o número de questões.');
      return;
    }
    const normalized = Math.round((form.numCorrect / total) * 10);
    const accuracy = Math.round((form.numCorrect / total) * 100);
    if (modalMode === 'fixacao') {
      onRegisterFixacao(selectedSubject.id, normalized, total, accuracy);
    } else {
      onRegisterReview(selectedSubject.id, normalized, total, accuracy);
    }
    closeModal();
  };

  const todayStr = localDateStr(new Date());

  const fmtDate = (iso: string | null) => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-');
    return `${d}-${m}-${y}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Cronograma</h2>
        <span className="text-muted text-[10px] font-black uppercase tracking-widest bg-white border border-border py-1 px-3 rounded-full">
          FSRS v6 ACTIVE
        </span>
      </div>

      {/* Area tabs */}
      {areas.length > 0 && (
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <div className="flex gap-2 min-w-max pb-1">
            {/* "Todos" tab */}
            <button
              onClick={() => setSelectedArea('__all__')}
              className={`py-1.5 px-4 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                selectedArea === '__all__'
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white text-navy/60 border-border hover:border-navy/30 hover:text-navy'
              }`}
            >
              Todos
              <span className={`ml-1.5 text-[9px] ${selectedArea === '__all__' ? 'text-white/70' : 'text-muted-light'}`}>
                {subjects.length}
              </span>
            </button>

            {areas.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`py-1.5 px-4 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                  area === activeArea
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-navy/60 border-border hover:border-navy/30 hover:text-navy'
                }`}
              >
                {area}
                <span className={`ml-1.5 text-[9px] ${area === activeArea ? 'text-white/70' : 'text-muted-light'}`}>
                  {subjects.filter((s) => s.area === area).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {visibleSubjects.map((s) => (
          <div
            key={s.id}
            ref={el => { cardRefs.current[s.id] = el; }}
            className={`bg-white p-6 rounded-2xl border flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group shadow-sm hover:shadow-md transition-all ${
              flashId === s.id
                ? 'border-amber-400 ring-2 ring-amber-300 ring-offset-1'
                : 'border-border'
            }`}
          >
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

              <div className="flex items-center gap-8 mt-4 flex-wrap">
                <div className="flex flex-col">
                  <span className="text-muted-light text-[9px] font-black uppercase mb-0.5">Estabilidade</span>
                  <span className="text-navy text-xs font-bold">{s.stability ? `${s.stability.toFixed(1)} dias` : 'Iniciante'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-light text-[9px] font-black uppercase mb-0.5">Última Revisão</span>
                  <span className="text-navy text-xs font-bold">
                    {fmtDate(s.lastReviewDate ? localDateStr(new Date(s.lastReviewDate)) : null) || 'Nunca'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-light text-[9px] font-black uppercase mb-0.5">Próxima Revisão</span>
                  <span className={`text-xs font-bold ${s.nextReviewDate && s.nextReviewDate <= todayStr ? 'text-red-600' : 'text-navy'}`}>
                    {fmtDate(s.nextReviewDate) || 'A definir'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto md:justify-start md:gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleAula(s.id)}
                  className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all border ${s.aulaAssistida ? 'bg-green-600 border-green-600 text-white' : 'bg-surface border-border text-muted hover:bg-white hover:text-navy'}`}
                >
                  Aula
                </button>
                <button
                  onClick={() => openModal(s, 'fixacao')}
                  className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all border ${s.flashcardsFeitos ? 'bg-green-600 border-green-600 text-white' : 'bg-surface border-border text-muted hover:bg-white hover:text-navy'}`}
                >
                  Fixação
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal(s, 'review')}
                  className="bg-navy text-white py-2 px-6 rounded-full text-[10px] font-black uppercase hover:bg-navy-light transition-all shadow-sm active:scale-95"
                >
                  REVISAR
                </button>

                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                    className="p-2 text-muted-light hover:text-navy transition-colors"
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                  </button>
                  {openMenuId === s.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-xl z-20 shadow-xl py-1">
                      <button
                        onClick={() => { onResetCiclo(s.id); setOpenMenuId(null); }}
                        className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-navy hover:bg-surface transition-colors uppercase"
                      >Resetar Ciclo</button>
                      <button
                        onClick={() => { onRevertStage(s.id); setOpenMenuId(null); }}
                        className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-navy hover:bg-surface transition-colors uppercase border-t border-border"
                      >Reverter Estabilidade</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}

      {selectedSubject && modalMode && (
        <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white border border-border rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h4 className="text-xl font-black text-navy mb-1 uppercase tracking-tight">
              {modalMode === 'fixacao' ? 'Registro de Fixação' : 'Registro de Revisão'}
            </h4>
            <p className="text-muted text-[10px] font-bold uppercase mb-6 tracking-widest">
              {selectedSubject.area} — {selectedSubject.aulaPrincipal}
            </p>

            <div className="space-y-4">
              {/* Data da revisão */}
              <div>
                <label className="block text-[9px] font-black text-muted-light uppercase tracking-widest mb-1.5">
                  Data da revisão
                </label>
                <input
                  type="date"
                  value={form.date}
                  max={localDateStr(new Date())}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>

              {/* Total de questões e Acertos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-muted-light uppercase tracking-widest mb-1.5">
                    Nº de questões
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.totalQuestions}
                    onChange={(e) => setForm({ ...form, totalQuestions: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label htmlFor="review-num-correct" className="block text-[9px] font-black text-muted-light uppercase tracking-widest mb-1.5">
                    Acertos
                  </label>
                  <input
                    id="review-num-correct"
                    type="number"
                    min={0}
                    max={parseInt(form.totalQuestions) || undefined}
                    value={form.numCorrect}
                    onChange={(e) => setForm({ ...form, numCorrect: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
              </div>

              {/* Barra de desempenho */}
              {(() => {
                const total = parseInt(form.totalQuestions) || 0;
                const pct = total > 0 ? (form.numCorrect / total) * 100 : 0;
                return (
                  <div className="bg-surface rounded-2xl border border-border p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black text-muted-light uppercase tracking-widest">Aproveitamento</span>
                      <span className="text-2xl font-black text-navy">{total > 0 ? Math.round(pct) : '—'}%</span>
                    </div>
                    <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct >= 80 ? '#16a34a' : pct >= 60 ? '#ca8a04' : '#dc2626',
                        }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Erro de validação */}
              {formError && (
                <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 py-4 text-muted text-[10px] font-black uppercase hover:text-navy transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
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
