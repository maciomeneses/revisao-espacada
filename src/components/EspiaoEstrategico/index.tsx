import type { Subject, PerformanceLevel } from '../../types';
import { getProximaTarefa } from '../../services/algorithm';

interface EspiaoProps {
  subjects: Subject[];
}

interface Column {
  key: PerformanceLevel;
  label: string;
  color: string;
  headerColor: string;
}

const COLUMNS: Column[] = [
  {
    key: 'nao_classificada',
    label: 'Não classificada',
    color: 'border-gray-600',
    headerColor: 'bg-[#3a3a3a] text-gray-300',
  },
  {
    key: 'gte_80',
    label: '≥ 80%',
    color: 'border-green-700',
    headerColor: 'bg-green-800/60 text-green-300',
  },
  {
    key: 'range_61_79',
    label: '61 – 79%',
    color: 'border-yellow-700',
    headerColor: 'text-yellow-300',
  },
  {
    key: 'lte_60',
    label: '≤ 60%',
    color: 'border-red-700',
    headerColor: 'bg-red-800/60 text-red-300',
  },
];

function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-3 hover:border-[#444] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-xs text-gray-500 font-medium">{subject.modulo}</div>
        {subject.relevancia === 'Alta' ? (
          <span className="badge-alta shrink-0">Alta</span>
        ) : subject.relevancia === 'Média' ? (
          <span className="badge-media shrink-0">Média</span>
        ) : (
          <span className="badge-baixa shrink-0">Baixa</span>
        )}
      </div>
      <div className="text-sm font-medium text-white leading-snug mb-2">
        {subject.aulaPrincipal}
      </div>
      <div className="flex items-center justify-between">
        <span className="badge-area">{subject.area}</span>
        <span className="text-xs text-blue-400">{getProximaTarefa(subject.currentStage)}</span>
      </div>
    </div>
  );
}

export function EspiaoEstrategico({ subjects }: EspiaoProps) {
  const grouped = new Map<PerformanceLevel, Subject[]>();
  for (const col of COLUMNS) {
    grouped.set(col.key, []);
  }
  for (const s of subjects) {
    const bucket = grouped.get(s.performanceLevel);
    if (bucket) bucket.push(s);
  }

  return (
    <div className="p-4 h-full">
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = grouped.get(col.key) ?? [];
          return (
            <div
              key={col.key}
              className={`flex flex-col shrink-0 w-72 rounded-xl border ${col.color} bg-[#141414]`}
            >
              {/* Column header */}
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${col.headerColor}`}
                style={col.key === 'range_61_79' ? { backgroundColor: '#b8860b33' } : undefined}
              >
                <span className="font-semibold text-sm">{col.label}</span>
                <span className="text-xs font-bold bg-black/20 rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-600">
                    Nenhum assunto aqui
                  </div>
                ) : (
                  items.map((s) => <SubjectCard key={s.id} subject={s} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
