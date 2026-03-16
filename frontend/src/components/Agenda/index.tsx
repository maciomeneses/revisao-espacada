import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Subject } from '../../types';
import { getProximaTarefa } from '../../services/algorithm';

interface AgendaProps { subjects: Subject[]; }

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAY_NAMES   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function formatISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function Agenda({ subjects }: AgendaProps) {
  const now = new Date();
  const [year, setYear]           = useState(now.getFullYear());
  const [month, setMonth]         = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const todayISO = now.toISOString().split('T')[0];

  const reviewMap = new Map<string, Subject[]>();
  for (const s of subjects) {
    if (s.nextReviewDate) {
      const existing = reviewMap.get(s.nextReviewDate) ?? [];
      existing.push(s);
      reviewMap.set(s.nextReviewDate, existing);
    }
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0);  setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const selectedSubjects = selectedDay ? (reviewMap.get(selectedDay) ?? []) : [];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-[#e2e8f0] text-muted hover:text-navy transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-navy">{MONTH_NAMES[month]} {year}</h2>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-[#e2e8f0] text-muted hover:text-navy transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted uppercase tracking-wide py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day      = i + 1;
          const iso      = formatISO(year, month, day);
          const items    = reviewMap.get(iso) ?? [];
          const isToday  = iso === todayISO;
          const isSelected = iso === selectedDay;
          const hasItems = items.length > 0;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : iso)}
              className={`relative p-2 rounded-xl min-h-[64px] text-left transition-colors border ${
                isSelected
                  ? 'bg-navy/10 border-navy'
                  : isToday
                    ? 'border-navy/30 bg-yellow-50'
                    : 'border-transparent hover:bg-surface-alt'
              }`}
            >
              <span className={`text-sm font-semibold ${
                isToday
                  ? 'text-white bg-navy rounded-full w-7 h-7 flex items-center justify-center'
                  : 'text-navy'
              }`}>
                {day}
              </span>
              {hasItems && (
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className={`text-[10px] leading-tight rounded px-1 truncate ${
                        s.relevancia === 'Alta'
                          ? 'bg-red-100 text-red-700'
                          : s.relevancia === 'Média'
                            ? 'text-yellow-800'
                            : 'bg-sky/20 text-sky-dark'
                      }`}
                      style={s.relevancia === 'Média' ? { backgroundColor: '#fef9c3' } : undefined}
                    >
                      {s.area.slice(0, 3)} {s.modulo.split(' ')[1]}
                    </div>
                  ))}
                  {items.length > 3 && <div className="text-[10px] text-muted">+{items.length - 3} mais</div>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="mt-6 bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm">
          <h3 className="text-sm font-bold text-navy mb-3">
            Revisões em {selectedDay.split('-').reverse().join('/')}
          </h3>
          {selectedSubjects.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma revisão agendada para este dia.</p>
          ) : (
            <div className="space-y-2">
              {selectedSubjects.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-[#e2e8f0]">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted">{s.modulo}</div>
                    <div className="text-sm font-semibold text-navy truncate">{s.aulaPrincipal}</div>
                    <div className="text-xs text-sky mt-0.5">{getProximaTarefa(s.currentStage)}</div>
                  </div>
                  <div className="shrink-0">
                    {s.relevancia === 'Alta' ? <span className="badge-alta">Alta</span>
                      : s.relevancia === 'Média' ? <span className="badge-media">Média</span>
                      : <span className="badge-baixa">Baixa</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 text-xs text-muted">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-200" />Alta relevância</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-100" />Média relevância</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-sky/20" />Baixa relevância</div>
      </div>
    </div>
  );
}
