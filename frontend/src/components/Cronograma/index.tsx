import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { Subject, Relevance } from '../../types';
import { SubjectRow } from './SubjectRow';
import type { useSubjects } from '../../hooks/useSubjects';

type SubjectsHook = ReturnType<typeof useSubjects>;

interface CronogramaProps {
  subjects: Subject[];
  onToggleAula: SubjectsHook['toggleAula'];
  onTogglePreAula: SubjectsHook['togglePreAula'];
  onToggleFlashcards: SubjectsHook['toggleFlashcards'];
  onRegisterReview: SubjectsHook['registerReview'];
  onResetCiclo: SubjectsHook['doResetCiclo'];
  onRevertStage: SubjectsHook['revertStage'];
}

const RELEVANCES: Relevance[] = ['Alta', 'Média', 'Baixa'];

export function Cronograma({
  subjects, onToggleAula, onTogglePreAula, onToggleFlashcards,
  onRegisterReview, onResetCiclo, onRevertStage,
}: CronogramaProps) {
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterRelevance, setFilterRelevance] = useState<Relevance | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const areas = useMemo(() => Array.from(new Set(subjects.map((s) => s.area))).sort(), [subjects]);

  const filtered = useMemo(() => subjects.filter((s) => {
    const matchSearch    = !search || s.aulaPrincipal.toLowerCase().includes(search.toLowerCase()) || s.modulo.toLowerCase().includes(search.toLowerCase());
    const matchArea      = !filterArea      || s.area      === filterArea;
    const matchRelevance = !filterRelevance || s.relevancia === filterRelevance;
    return matchSearch && matchArea && matchRelevance;
  }), [subjects, search, filterArea, filterRelevance]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-[#e2e8f0] flex-wrap bg-white">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-light" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar assunto..."
            className="w-full pl-9 pr-3 py-2 bg-surface-alt border border-[#e2e8f0] rounded-full text-sm text-navy placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-sky/40 transition-all"
          />
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm border transition-colors ${
            showFilters
              ? 'bg-navy/10 border-navy text-navy font-semibold'
              : 'bg-surface-alt border-[#e2e8f0] text-muted hover:text-navy'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filtros
        </button>

        <span className="text-xs text-muted ml-auto">
          {filtered.length} / {subjects.length} assuntos
        </span>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-[#e2e8f0] flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">Área:</span>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="bg-white border border-[#e2e8f0] rounded-lg px-2 py-1 text-xs text-navy focus:outline-none"
            >
              <option value="">Todas</option>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">Relevância:</span>
            <select
              value={filterRelevance}
              onChange={(e) => setFilterRelevance(e.target.value as Relevance | '')}
              className="bg-white border border-[#e2e8f0] rounded-lg px-2 py-1 text-xs text-navy focus:outline-none"
            >
              <option value="">Todas</option>
              {RELEVANCES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {(filterArea || filterRelevance || search) && (
            <button
              onClick={() => { setFilterArea(''); setFilterRelevance(''); setSearch(''); }}
              className="text-xs text-sky hover:text-sky-dark font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface-alt">
            <tr className="text-xs text-muted border-b border-[#e2e8f0]">
              <th className="text-left px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap min-w-[140px]">Módulo</th>
              <th className="text-left px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap min-w-[100px]">Área</th>
              <th className="text-left px-3 py-3 font-semibold uppercase tracking-wide min-w-[220px]">Aula Principal</th>
              <th className="text-left px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap min-w-[90px]">Relevância</th>
              <th className="text-center px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap w-16">Aula</th>
              <th className="text-center px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap w-20">Pré-Aula</th>
              <th className="text-center px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap w-24">Flashcards</th>
              <th className="text-left px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap min-w-[110px]">Desempenho</th>
              <th className="text-center px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap w-24">Fix. 24H</th>
              <th className="text-center px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap w-28">Est. Reverso</th>
              <th className="text-center px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap w-20">Rev 7D</th>
              <th className="text-center px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap w-20">Rev 30D</th>
              <th className="text-center px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap w-20">Rev 60D</th>
              <th className="text-center px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap w-20">Rev 90D</th>
              <th className="text-left px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap min-w-[130px]">Última Exec.</th>
              <th className="text-left px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap min-w-[130px]">Próx. Execução</th>
              <th className="text-left px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap min-w-[150px]">Próx. Tarefa</th>
              <th className="text-left px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap min-w-[90px]">Status</th>
              <th className="text-center px-3 py-3 font-semibold uppercase tracking-wide whitespace-nowrap w-32">Resetar Ciclo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((subject) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
                onToggleAula={onToggleAula}
                onTogglePreAula={onTogglePreAula}
                onToggleFlashcards={onToggleFlashcards}
                onRegisterReview={onRegisterReview}
                onResetCiclo={onResetCiclo}
                onRevertStage={onRevertStage}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={19} className="py-12 text-center text-muted">
                  Nenhum assunto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
