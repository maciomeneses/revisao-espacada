import { useState, useMemo } from 'react';
import type { Subject, StudentRoutine, RoutineSlot } from '../types';
import { localDateStr } from '../services/algorithm';
import { Agenda } from './Agenda';
import { RoutineBoard } from './RoutineBoard';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

interface DashboardProps {
  subjects: Subject[];
  onNavigateCronograma: (subjectId?: string) => void;
  onRegisterReview: (id: string, numCorrect: number, total: number, accuracy: number, date: string, durationSeconds: number) => void;
  routine: StudentRoutine;
  availableAreas: string[];
  onAddSlot: (slot: Omit<RoutineSlot, 'id'>) => void;
  onUpdateSlot: (id: string, patch: Partial<Omit<RoutineSlot, 'id'>>) => void;
  onRemoveSlot: (id: string) => void;
}

function shiftDate(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}

function formatSelectedDay(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Hoje';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function reviewOrdinal(s: Subject): string {
  const n = (s.reps ?? 0) + 1;
  const ordinals = ['1ª', '2ª', '3ª', '4ª', '5ª', '6ª', '7ª', '8ª', '9ª', '10ª'];
  return `${ordinals[Math.min(n - 1, ordinals.length - 1)]} revisão`;
}

function relevanceBadge(rel: string): string {
  if (rel === 'Alta') return 'bg-red-50 text-red-600 border-red-200';
  if (rel === 'Média') return 'bg-yellow/20 text-yellow-700 border-yellow/30';
  return 'bg-green-50 text-green-600 border-green-200';
}

function calcDaysAgo(dateStr: string, todayStr: string): number {
  const a = new Date(todayStr + 'T12:00:00');
  const b = new Date(dateStr + 'T12:00:00');
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

function parseDuration(s: string): number {
  if (!s.trim()) return 0;
  const parts = s.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export function Dashboard({ subjects, onNavigateCronograma, onRegisterReview, routine, availableAreas, onAddSlot, onUpdateSlot, onRemoveSlot }: DashboardProps) {
  const todayStr = localDateStr(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [reviewingSubject, setReviewingSubject] = useState<Subject | null>(null);
  const [reviewForm, setReviewForm] = useState({ totalQuestions: '10', numCorrect: 7, duration: '' });
  const [reviewError, setReviewError] = useState<string | null>(null);

  const dashStats = useMemo(() => ({
    totalMaterias: subjects.length,
    revisoesHoje: subjects.filter(s => s.nextReviewDate && s.nextReviewDate <= todayStr).length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [subjects]);

  const reviewsByDate = useMemo(() => {
    const map = new Map<string, Subject[]>();
    for (const s of subjects) {
      if (!s.nextReviewDate) continue;
      const list = map.get(s.nextReviewDate) ?? [];
      list.push(s);
      map.set(s.nextReviewDate, list);
    }
    return map;
  }, [subjects]);

  const daySubjects = reviewsByDate.get(selectedDay) ?? [];

  const overdueSubjects = useMemo(
    () =>
      subjects
        .filter((s) => s.nextReviewDate && s.nextReviewDate < todayStr)
        .sort((a, b) => (a.nextReviewDate! < b.nextReviewDate! ? -1 : 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subjects],
  );

  const openReviewModal = (s: Subject) => {
    setReviewingSubject(s);
    setReviewForm({ totalQuestions: '10', numCorrect: 7, duration: '' });
    setReviewError(null);
  };

  const handleReviewConfirm = () => {
    if (!reviewingSubject) return;
    const total = parseInt(reviewForm.totalQuestions);
    if (!total || total <= 0) {
      setReviewError('O número de questões deve ser maior que zero.');
      return;
    }
    if (reviewForm.numCorrect > total) {
      setReviewError('Os acertos não podem ser maiores que o número de questões.');
      return;
    }
    const normalized = Math.round((reviewForm.numCorrect / total) * 10);
    const accuracy = Math.round((reviewForm.numCorrect / total) * 100);
    onRegisterReview(reviewingSubject.id, normalized, total, accuracy, localDateStr(new Date()), parseDuration(reviewForm.duration));
    setReviewingSubject(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Total de Matérias',  value: dashStats.totalMaterias, icon: BookOpen },
          { label: 'Revisões para Hoje', value: dashStats.revisoesHoje,  icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-muted-light text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-black text-navy">{value}</p>
              </div>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-navy/5 shrink-0 ml-3">
                <Icon className="w-3.5 h-3.5 text-navy/40" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revisões de Hoje + Atrasadas ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revisões do dia selecionado */}
        <div className="md:col-span-2 bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-navy shrink-0" />
              <span className="font-black text-navy text-sm uppercase tracking-tight">Revisões para Hoje</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedDay(shiftDate(selectedDay, -1))}
                className="p-1.5 rounded-lg hover:bg-surface transition-colors text-muted hover:text-navy"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-black text-muted capitalize min-w-[160px] text-center">
                {formatSelectedDay(selectedDay, todayStr)}
              </span>
              <button
                onClick={() => setSelectedDay(shiftDate(selectedDay, 1))}
                className="p-1.5 rounded-lg hover:bg-surface transition-colors text-muted hover:text-navy"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-2.5 min-h-[100px]">
            {daySubjects.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-light text-xs font-black uppercase tracking-[0.2em]">Nenhuma revisão</p>
              </div>
            ) : (
              daySubjects.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-surface rounded-2xl px-4 py-3 border border-border/50 gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-navy font-bold text-sm">{s.aulaPrincipal}</p>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider shrink-0">
                        {reviewOrdinal(s)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] text-muted font-bold">{s.modulo}</span>
                      <span className="text-muted/30 text-xs">•</span>
                      <span className="text-[9px] font-black text-muted-light uppercase">Relevância:</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${relevanceBadge(s.relevancia)}`}>
                        {s.relevancia}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openReviewModal(s)}
                    className="py-1.5 px-4 rounded-full bg-navy hover:bg-navy-light text-white text-[10px] font-black uppercase transition-colors shrink-0"
                  >
                    Revisar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Revisões Pendentes */}
        <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-black text-navy text-sm uppercase tracking-tight">Revisões Pendentes</span>
          </div>

          <div className="p-4 space-y-2.5 min-h-[100px] max-h-[360px] overflow-y-auto">
            {overdueSubjects.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-light text-xs font-black uppercase tracking-[0.2em]">Nenhuma atrasada</p>
              </div>
            ) : (
              overdueSubjects.map((s) => (
                <div key={s.id} className="bg-surface rounded-2xl px-4 py-3 border border-border/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-navy font-bold text-sm leading-tight">{s.aulaPrincipal}</p>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider shrink-0">
                          {reviewOrdinal(s)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] text-muted font-bold">{s.modulo}</span>
                        <span className="text-muted/30 text-xs">•</span>
                        <span className="text-[9px] font-black text-muted-light uppercase">Relevância:</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${relevanceBadge(s.relevancia)}`}>
                          {s.relevancia}
                        </span>
                      </div>
                      <p className="text-[9px] font-black text-amber-600 mt-1.5">
                        {calcDaysAgo(s.nextReviewDate!, todayStr)}d atrás
                      </p>
                    </div>
                    <button
                      onClick={() => openReviewModal(s)}
                      className="w-8 h-8 rounded-full bg-navy hover:bg-navy-light text-white flex items-center justify-center transition-colors shrink-0 mt-0.5"
                      title="Revisar"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Agenda (semana / mês) ─────────────────────────────────── */}
      <Agenda subjects={subjects} />

      {/* ── Rotina Semanal ───────────────────────────────────────── */}
      <RoutineBoard
        routine={routine}
        availableAreas={availableAreas}
        onAdd={onAddSlot}
        onUpdate={onUpdateSlot}
        onRemove={onRemoveSlot}
      />

      {/* ── FSRS card (fim da página) ─────────────────────────────── */}
      <div className="bg-white rounded-3xl p-8 border border-border relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <span className="text-9xl font-black text-navy">FSRS</span>
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl font-black text-navy mb-4 leading-tight uppercase tracking-tight">
            Seu progresso é guiado por ciência.
          </h2>
          <p className="text-muted mb-8 leading-relaxed font-medium">
            Utilizamos o algoritmo FSRS v6 para calcular a retenção ideal de cada tema, otimizando seu tempo de estudo de forma dinâmica e personalizada.
          </p>
          <button
            onClick={() => onNavigateCronograma()}
            className="bg-navy text-white font-black py-4 px-10 rounded-full text-[10px] uppercase tracking-widest hover:bg-navy-light transition-all shadow-md active:scale-95"
          >
            IR PARA O CRONOGRAMA
          </button>
        </div>
      </div>

      {/* ── Modal de revisão ─────────────────────────────────────────── */}
      {reviewingSubject && (
        <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white border border-border rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h4 className="text-xl font-black text-navy mb-1 uppercase tracking-tight">Registro de Revisão</h4>
            <p className="text-muted text-[10px] font-bold uppercase mb-6 tracking-widest">
              {reviewingSubject.area} — {reviewingSubject.aulaPrincipal}
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-muted-light uppercase tracking-widest mb-1.5">
                    Nº de questões
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={reviewForm.totalQuestions}
                    onChange={(e) => setReviewForm({ ...reviewForm, totalQuestions: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label htmlFor="dash-review-acertos" className="block text-[9px] font-black text-muted-light uppercase tracking-widest mb-1.5">
                    Acertos
                  </label>
                  <input
                    id="dash-review-acertos"
                    type="number"
                    min={0}
                    max={parseInt(reviewForm.totalQuestions) || undefined}
                    value={reviewForm.numCorrect}
                    onChange={(e) => setReviewForm({ ...reviewForm, numCorrect: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-muted-light uppercase tracking-widest mb-1.5">
                  Tempo (hh:mm:ss)
                </label>
                <input
                  type="text"
                  value={reviewForm.duration}
                  onChange={(e) => setReviewForm({ ...reviewForm, duration: e.target.value })}
                  placeholder="00:30:00"
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>

              {/* Barra de aproveitamento */}
              {(() => {
                const total = parseInt(reviewForm.totalQuestions) || 0;
                const pct = total > 0 ? (reviewForm.numCorrect / total) * 100 : 0;
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

              {reviewError && (
                <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  {reviewError}
                </p>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setReviewingSubject(null)}
                className="flex-1 py-4 text-muted text-[10px] font-black uppercase hover:text-navy transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReviewConfirm}
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
