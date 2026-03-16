import type { Subject, PerformanceLevel } from '../../types';
import { getProximaTarefa } from '../../services/algorithm';

interface EspiaoProps { subjects: Subject[]; }

interface Column {
  key: PerformanceLevel;
  label: string;
  border: string;
  header: string;
  headerStyle?: React.CSSProperties;
}

const COLUMNS: Column[] = [
  { key: 'nao_classificada', label: 'Não classificada', border: 'border-[#e2e8f0]',  header: 'bg-surface-alt text-muted' },
  { key: 'gte_80',           label: '≥ 80%',            border: 'border-green-200',  header: 'bg-green-50 text-green-700' },
  { key: 'range_61_79',      label: '61 – 79%',         border: 'border-yellow-300', header: 'text-yellow-800', headerStyle: { backgroundColor: '#fef9c3' } },
  { key: 'lte_60',           label: '≤ 60%',            border: 'border-red-200',    header: 'bg-red-50 text-red-700' },
];

function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 hover:border-[#cbd5e1] hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-xs text-muted font-medium">{subject.modulo}</div>
        {subject.relevancia === 'Alta'  ? <span className="badge-alta  shrink-0">Alta</span>
          : subject.relevancia === 'Média' ? <span className="badge-media shrink-0">Média</span>
          : <span className="badge-baixa shrink-0">Baixa</span>}
      </div>
      <div className="text-sm font-semibold text-navy leading-snug mb-2">{subject.aulaPrincipal}</div>
      <div className="flex items-center justify-between">
        <span className="badge-area">{subject.area}</span>
        <span className="text-xs text-sky">{getProximaTarefa(subject.currentStage)}</span>
      </div>
    </div>
  );
}

export function EspiaoEstrategico({ subjects }: EspiaoProps) {
  const grouped = new Map<PerformanceLevel, Subject[]>();
  for (const col of COLUMNS) grouped.set(col.key, []);
  for (const s of subjects) {
    const bucket = grouped.get(s.performanceLevel);
    if (bucket) bucket.push(s);
  }

  return (
    <div className="p-4 h-full bg-surface">
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = grouped.get(col.key) ?? [];
          return (
            <div key={col.key} className={`flex flex-col shrink-0 w-72 rounded-2xl border ${col.border} bg-white shadow-sm`}>
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${col.header}`}
                style={col.headerStyle}
              >
                <span className="font-bold text-sm">{col.label}</span>
                <span className="text-xs font-bold bg-black/10 rounded-full px-2 py-0.5">{items.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-light">Nenhum assunto aqui</div>
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
