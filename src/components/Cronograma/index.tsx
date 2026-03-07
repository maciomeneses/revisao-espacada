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
}

const RELEVANCES: Relevance[] = ['Alta', 'Média', 'Baixa'];

export function Cronograma({
  subjects,
  onToggleAula,
  onTogglePreAula,
  onToggleFlashcards,
  onRegisterReview,
  onResetCiclo,
}: CronogramaProps) {
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterRelevance, setFilterRelevance] = useState<Relevance | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const areas = useMemo(() => {
    const set = new Set(subjects.map((s) => s.area));
    return Array.from(set).sort();
  }, [subjects]);

  const filtered = useMemo(() => {
    return subjects.filter((s) => {
      const matchSearch =
        !search ||
        s.aulaPrincipal.toLowerCase().includes(search.toLowerCase()) ||
        s.modulo.toLowerCase().includes(search.toLowerCase());
      const matchArea = !filterArea || s.area === filterArea;
      const matchRelevance = !filterRelevance || s.relevancia === filterRelevance;
      return matchSearch && matchArea && matchRelevance;
    });
  }, [subjects, search, filterArea, filterRelevance]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-[#2a2a2a] flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar assunto..."
            className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
            showFilters
              ? 'bg-blue-600/20 border-blue-600 text-blue-400'
              : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filtros
        </button>

        {/* Count */}
        <span className="text-xs text-gray-500 ml-auto">
          {filtered.length} / {subjects.length} assuntos
        </span>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#141414] border-b border-[#2a2a2a] flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Área:</span>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs text-white"
            >
              <option value="">Todas</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Relevância:</span>
            <select
              value={filterRelevance}
              onChange={(e) => setFilterRelevance(e.target.value as Relevance | '')}
              className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs text-white"
            >
              <option value="">Todas</option>
              {RELEVANCES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {(filterArea || filterRelevance || search) && (
            <button
              onClick={() => { setFilterArea(''); setFilterRelevance(''); setSearch(''); }}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[#0f0f0f]">
            <tr className="text-xs text-gray-500 border-b border-[#2a2a2a]">
              <th className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[140px]">Módulo</th>
              <th className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[100px]">Área</th>
              <th className="text-left px-3 py-3 font-medium min-w-[220px]">Aula Principal</th>
              <th className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[90px]">Relevância</th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap w-16">Aula</th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap w-20">Pré-Aula</th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap w-24">Flashcards</th>
              <th className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[110px]">Desempenho</th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap w-24">Fix. 24H</th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap w-28">Est. Reverso</th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap w-20">Rev 7D</th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap w-20">Rev 30D</th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap w-20">Rev 60D</th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap w-20">Rev 90D</th>
              <th className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[130px]">Última Exec.</th>
              <th className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[130px]">Próx. Execução</th>
              <th className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[150px]">Próx. Tarefa</th>
              <th className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[90px]">Status</th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap w-32">Resetar Ciclo</th>
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
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={19} className="py-12 text-center text-gray-500">
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
