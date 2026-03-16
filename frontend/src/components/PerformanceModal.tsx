import { X } from 'lucide-react';
import type { Performance, Subject } from '../types';
import { getProximaTarefa } from '../services/algorithm';

interface PerformanceModalProps {
  subject: Subject;
  onConfirm: (performance: Performance) => void;
  onCancel: () => void;
}

const OPTIONS: { value: Performance; label: string; desc: string; color: string }[] = [
  {
    value: 'lte_60',
    label: '≤ 60%',
    desc: 'Erro crítico — precisa de mais revisão',
    color: 'border-red-600 hover:bg-red-600/10',
  },
  {
    value: 'range_61_79',
    label: '61 – 79%',
    desc: 'Desempenho médio — básico entendido',
    color: 'border-yellow-600 hover:bg-yellow-600/10',
  },
  {
    value: 'gte_80',
    label: '≥ 80%',
    desc: 'Domínio — excelente!',
    color: 'border-green-600 hover:bg-green-600/10',
  },
];

export function PerformanceModal({ subject, onConfirm, onCancel }: PerformanceModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#1e1e1e] rounded-xl shadow-xl w-full max-w-md border border-[#333]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#333]">
          <div>
            <p className="text-xs text-gray-400 mb-1">{subject.modulo}</p>
            <h2 className="text-base font-semibold text-white">{subject.aulaPrincipal}</h2>
            <p className="text-sm text-gray-300 mt-1">
              Registrar:{' '}
              <span className="text-blue-400 font-medium">
                {getProximaTarefa(subject.currentStage)}
              </span>
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white ml-4 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-400 mb-4">Qual foi o seu desempenho?</p>
          {OPTIONS.map(({ value, label, desc, color }) => (
            <button
              key={value}
              onClick={() => onConfirm(value)}
              className={`w-full text-left p-4 rounded-lg border ${color} transition-colors`}
            >
              <div className="font-semibold text-white">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
