import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Subject } from '../../types';
import { getProximaTarefa } from '../../services/algorithm';

interface AgendaProps {
  subjects: Subject[];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sunday
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function Agenda({ subjects }: AgendaProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const todayISO = now.toISOString().split('T')[0];

  // Build a map: isoDate -> subjects due on that day
  const reviewMap = new Map<string, Subject[]>();
  for (const s of subjects) {
    if (s.nextReviewDate) {
      const existing = reviewMap.get(s.nextReviewDate) ?? [];
      existing.push(s);
      reviewMap.set(s.nextReviewDate, existing);
    }
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const selectedSubjects = selectedDay ? (reviewMap.get(selectedDay) ?? []) : [];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-white">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = formatISO(year, month, day);
          const items = reviewMap.get(iso) ?? [];
          const isToday = iso === todayISO;
          const isSelected = iso === selectedDay;
          const hasItems = items.length > 0;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : iso)}
              className={`relative p-2 rounded-lg min-h-[64px] text-left transition-colors border ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500'
                  : isToday
                    ? 'border-white/30 bg-[#1e1e1e]'
                    : 'border-transparent hover:bg-[#1e1e1e]'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  isToday
                    ? 'text-white bg-[#e74c3c] rounded-full w-7 h-7 flex items-center justify-center'
                    : 'text-gray-300'
                }`}
              >
                {day}
              </span>
              {hasItems && (
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className={`text-[10px] leading-tight rounded px-1 truncate ${
                        s.relevancia === 'Alta'
                          ? 'bg-red-700/60 text-red-200'
                          : s.relevancia === 'Média'
                            ? 'text-yellow-200'
                            : 'bg-blue-700/60 text-blue-200'
                      }`}
                      style={s.relevancia === 'Média' ? { backgroundColor: '#b8860b66' } : undefined}
                    >
                      {s.area.slice(0, 3)} {s.modulo.split(' ')[1]}
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-[10px] text-gray-500">+{items.length - 3} mais</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="mt-6 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            Revisões em {selectedDay.split('-').reverse().join('/')}
          </h3>
          {selectedSubjects.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma revisão agendada para este dia.</p>
          ) : (
            <div className="space-y-2">
              {selectedSubjects.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#222] border border-[#333]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400">{s.modulo}</div>
                    <div className="text-sm font-medium text-white truncate">{s.aulaPrincipal}</div>
                    <div className="text-xs text-blue-400 mt-0.5">
                      {getProximaTarefa(s.currentStage)}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {s.relevancia === 'Alta' ? (
                      <span className="badge-alta">Alta</span>
                    ) : s.relevancia === 'Média' ? (
                      <span className="badge-media">Média</span>
                    ) : (
                      <span className="badge-baixa">Baixa</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-700/60" />
          Alta relevância
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#b8860b66' }} />
          Média relevância
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-700/60" />
          Baixa relevância
        </div>
      </div>
    </div>
  );
}
