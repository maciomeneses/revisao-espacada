import { X } from 'lucide-react';
import type { Performance, Subject } from '../types';
import { getProximaTarefa } from '../services/algorithm';

interface PerformanceModalProps {
  subject: Subject;
  onConfirm: (performance: Performance) => void;
  onCancel: () => void;
}

const OPTIONS: { value: Performance; label: string; desc: string; bg: string; border: string; text: string }[] = [
  {
    value: 'lte_60',
    label: '≤ 60%',
    desc: 'Erro crítico — precisa de mais revisão',
    bg: 'hover:bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700',
  },
  {
    value: 'range_61_79',
    label: '61 – 79%',
    desc: 'Desempenho médio — básico entendido',
    bg: 'hover:bg-yellow-50',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
  },
  {
    value: 'gte_80',
    label: '≥ 80%',
    desc: 'Domínio — excelente!',
    bg: 'hover:bg-green-50',
    border: 'border-green-400',
    text: 'text-green-700',
  },
];

export function PerformanceModal({ subject, onConfirm, onCancel }: PerformanceModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#e2e8f0]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#e2e8f0]">
          <div>
            <p className="text-xs text-muted mb-1">{subject.modulo}</p>
            <h2 className="text-base font-semibold text-navy">{subject.aulaPrincipal}</h2>
            <p className="text-sm text-muted mt-1">
              Registrar:{' '}
              <span className="text-sky font-medium">
                {getProximaTarefa(subject.currentStage)}
              </span>
            </p>
          </div>
          <button onClick={onCancel} className="text-muted-light hover:text-navy ml-4 mt-0.5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-muted mb-4">Qual foi o seu desempenho?</p>
          {OPTIONS.map(({ value, label, desc, bg, border, text }) => (
            <button
              key={value}
              onClick={() => onConfirm(value)}
              className={`w-full text-left p-4 rounded-xl border ${border} ${bg} transition-colors`}
            >
              <div className={`font-semibold ${text}`}>{label}</div>
              <div className="text-xs text-muted mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
