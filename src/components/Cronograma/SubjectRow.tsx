import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { Performance, ReviewStage, Subject } from '../../types';
import { getProximaTarefa, getFormulaStatus } from '../../services/algorithm';
import { PerformanceModal } from '../PerformanceModal';
import type { useSubjects } from '../../hooks/useSubjects';

type SubjectsHook = ReturnType<typeof useSubjects>;

interface SubjectRowProps {
  subject: Subject;
  onToggleAula: SubjectsHook['toggleAula'];
  onTogglePreAula: SubjectsHook['togglePreAula'];
  onToggleFlashcards: SubjectsHook['toggleFlashcards'];
  onRegisterReview: SubjectsHook['registerReview'];
  onResetCiclo: SubjectsHook['doResetCiclo'];
  onRevertStage: SubjectsHook['revertStage'];
}

function RelevanceBadge({ relevance }: { relevance: Subject['relevancia'] }) {
  if (relevance === 'Alta') return <span className="badge-alta">Alta</span>;
  if (relevance === 'Média') return <span className="badge-media">Média</span>;
  return <span className="badge-baixa">Baixa</span>;
}

function AreaBadge({ area }: { area: Subject['area'] }) {
  return <span className="badge-area">{area}</span>;
}

function PerformanceBadge({ level }: { level: Subject['performanceLevel'] }) {
  if (level === 'gte_80')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-700 text-white">
        ≥ 80%
      </span>
    );
  if (level === 'range_61_79')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#b8860b' }}>
        61 – 79%
      </span>
    );
  if (level === 'lte_60')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-700 text-white">
        ≤ 60%
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#3a3a3a] text-gray-400">
      Não classific.
    </span>
  );
}

function Checkbox({
  checked,
  onClick,
  disabled,
}: {
  checked: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
        checked
          ? 'bg-blue-600 border-blue-600'
          : disabled
            ? 'border-[#3a3a3a] cursor-default opacity-30'
            : 'border-[#555] hover:border-blue-500 cursor-pointer'
      }`}
    >
      {checked && (
        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
          <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function FormulaCell({ status }: { status: string }) {
  if (!status) return <span className="text-gray-600">—</span>;
  if (status === 'Atrasado')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
        🚨 Atrasado
      </span>
    );
  if (status === 'Hoje')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-400">
        ⚡ Hoje
      </span>
    );
  if (status === 'No Prazo')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400">
        ⏳ No Prazo
      </span>
    );
  if (status === 'Concluído')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400">
        🎉 Concluído
      </span>
    );
  return <span className="text-gray-400 text-xs">{status}</span>;
}

// Which stages require performance input when the checkbox is clicked
const REVIEW_STAGES = new Set(['fixacao', 'estudo_reverso', 'rev7d', 'rev30d', 'rev60d', 'rev90d']);

export function SubjectRow({
  subject,
  onToggleAula,
  onTogglePreAula,
  onToggleFlashcards,
  onRegisterReview,
  onResetCiclo,
  onRevertStage,
}: SubjectRowProps) {
  const [showModal, setShowModal] = useState(false);
  const [pendingStage, setPendingStage] = useState<string | null>(null);

  const stageChecked: Record<string, boolean> = {
    fixacao: subject.fixacao24hFeita,
    estudo_reverso: subject.estudoReversoFeito,
    rev7d: subject.rev7dFeita,
    rev30d: subject.rev30dFeita,
    rev60d: subject.rev60dFeita,
    rev90d: subject.rev90dFeita,
  };

  const handleReviewClick = (stage: string) => {
    // If already checked, allow reverting with confirmation
    if (stageChecked[stage]) {
      if (confirm(`Desfazer esta etapa de "${subject.aulaPrincipal}"?`)) {
        onRevertStage(subject.id, stage as ReviewStage);
      }
      return;
    }
    if (subject.currentStage !== stage) return;
    if (REVIEW_STAGES.has(stage)) {
      setPendingStage(stage);
      setShowModal(true);
    }
  };

  const handleConfirm = (performance: Performance) => {
    setShowModal(false);
    setPendingStage(null);
    onRegisterReview(subject.id, performance);
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingStage(null);
  };

  const isCurrentStage = (stage: string) => subject.currentStage === stage;
  const isDone = subject.currentStage === 'concluido';

  const formula = getFormulaStatus(subject);
  const proximaTarefa = getProximaTarefa(subject.currentStage);

  return (
    <>
      <tr className="table-row-base">
        {/* Módulo */}
        <td className="px-3 py-2.5 text-xs font-medium text-gray-300 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">🎧</span>
            {subject.modulo}
          </div>
        </td>

        {/* Área */}
        <td className="px-3 py-2.5 whitespace-nowrap">
          <AreaBadge area={subject.area} />
        </td>

        {/* Aula Principal */}
        <td className="px-3 py-2.5 text-sm text-gray-200">{subject.aulaPrincipal}</td>

        {/* Relevância */}
        <td className="px-3 py-2.5 whitespace-nowrap">
          <RelevanceBadge relevance={subject.relevancia} />
        </td>

        {/* Aula */}
        <td className="px-3 py-2.5">
          <div className="checkbox-cell">
            <Checkbox
              checked={subject.aulaAssistida}
              onClick={() => onToggleAula(subject.id)}
            />
          </div>
        </td>

        {/* Pré-Aula */}
        <td className="px-3 py-2.5">
          <div className="checkbox-cell">
            <Checkbox
              checked={subject.preAulaFeita}
              onClick={() => onTogglePreAula(subject.id)}
            />
          </div>
        </td>

        {/* Flashcards */}
        <td className="px-3 py-2.5">
          <div className="checkbox-cell">
            <Checkbox
              checked={subject.flashcardsFeitos}
              onClick={() => onToggleFlashcards(subject.id)}
            />
          </div>
        </td>

        {/* Desempenho */}
        <td className="px-3 py-2.5 whitespace-nowrap">
          <PerformanceBadge level={subject.performanceLevel} />
        </td>

        {/* Fixação 24H */}
        <td className="px-3 py-2.5">
          <div className="checkbox-cell">
            <Checkbox
              checked={subject.fixacao24hFeita}
              onClick={() => handleReviewClick('fixacao')}
              disabled={!isCurrentStage('fixacao') && !subject.fixacao24hFeita}
            />
          </div>
        </td>

        {/* Estudo Reverso */}
        <td className="px-3 py-2.5">
          <div className="checkbox-cell">
            <Checkbox
              checked={subject.estudoReversoFeito}
              onClick={() => handleReviewClick('estudo_reverso')}
              disabled={!isCurrentStage('estudo_reverso') && !subject.estudoReversoFeito}
            />
          </div>
        </td>

        {/* Rev 7D */}
        <td className="px-3 py-2.5">
          <div className="checkbox-cell">
            <Checkbox
              checked={subject.rev7dFeita}
              onClick={() => handleReviewClick('rev7d')}
              disabled={!isCurrentStage('rev7d') && !subject.rev7dFeita}
            />
          </div>
        </td>

        {/* Rev 30D */}
        <td className="px-3 py-2.5">
          <div className="checkbox-cell">
            <Checkbox
              checked={subject.rev30dFeita}
              onClick={() => handleReviewClick('rev30d')}
              disabled={!isCurrentStage('rev30d') && !subject.rev30dFeita}
            />
          </div>
        </td>

        {/* Rev 60D */}
        <td className="px-3 py-2.5">
          <div className="checkbox-cell">
            <Checkbox
              checked={subject.rev60dFeita}
              onClick={() => handleReviewClick('rev60d')}
              disabled={!isCurrentStage('rev60d') && !subject.rev60dFeita}
            />
          </div>
        </td>

        {/* Rev 90D */}
        <td className="px-3 py-2.5">
          <div className="checkbox-cell">
            <Checkbox
              checked={subject.rev90dFeita}
              onClick={() => handleReviewClick('rev90d')}
              disabled={!isCurrentStage('rev90d') && !subject.rev90dFeita}
            />
          </div>
        </td>

        {/* Última Execução */}
        <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">
          {formatDate(subject.lastReviewDate)}
        </td>

        {/* Próxima Execução */}
        <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">
          {formatDate(subject.nextReviewDate)}
        </td>

        {/* Próxima Tarefa */}
        <td className="px-3 py-2.5 text-xs whitespace-nowrap">
          {isDone ? (
            <span className="text-green-400">🎉 Concluído</span>
          ) : (
            <span className="text-gray-300">{proximaTarefa}</span>
          )}
        </td>

        {/* Formula/Status */}
        <td className="px-3 py-2.5 whitespace-nowrap">
          <FormulaCell status={formula} />
        </td>

        {/* Resetar Ciclo */}
        <td className="px-3 py-2.5">
          <div className="flex justify-center">
            <button
              onClick={() => {
                if (confirm(`Resetar ciclo de "${subject.aulaPrincipal}"?`)) {
                  onResetCiclo(subject.id);
                }
              }}
              disabled={!subject.aulaAssistida}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-red-400 disabled:opacity-20 disabled:cursor-default transition-colors"
              title="Resetar Ciclo"
            >
              <RotateCcw size={13} />
              Resetar
            </button>
          </div>
        </td>
      </tr>

      {/* Performance modal */}
      {showModal && pendingStage && (
        <PerformanceModal
          subject={subject}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
