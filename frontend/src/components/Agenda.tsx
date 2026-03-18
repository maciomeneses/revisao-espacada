import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Subject } from '../types';

interface AgendaProps {
  subjects: Subject[];
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function Agenda({ subjects }: AgendaProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDate = new Date();

  const [viewDate, setViewDate] = useState(
    new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Map: dateStr → subjects due that day
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

  // Calendar grid — days padded to start on Sunday
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad end to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectedSubjects = reviewsByDate.get(selectedDay) ?? [];
  const selectedIsPast = selectedDay < todayStr;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
      <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Agenda</h2>

      {/* ── Calendar card ─────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
        {/* Header: month navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-surface transition-colors text-muted hover:text-navy"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-black text-navy uppercase tracking-widest text-sm">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-surface transition-colors text-muted hover:text-navy"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[9px] font-black text-muted-light uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="aspect-square border-b border-r border-border/40 last:border-r-0" />;

            const dateStr = toDateStr(year, month, day);
            const count = reviewsByDate.get(dateStr)?.length ?? 0;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;
            const isPast = dateStr < todayStr;
            const hasOverdue = isPast && count > 0;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(dateStr)}
                className={`aspect-square flex flex-col items-center justify-center gap-0.5 border-b border-r border-border/40 last:border-r-0 transition-all text-sm font-bold
                  ${isSelected ? 'bg-navy text-white' : isToday ? 'bg-yellow/20 text-navy' : 'hover:bg-surface text-navy/70'}`}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white' :
                    hasOverdue ? 'bg-red-500' :
                    isToday ? 'bg-navy' :
                    'bg-sky-400'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected day's reviews ────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black text-muted-light uppercase tracking-widest mb-3">
          {selectedDay === todayStr
            ? 'Hoje'
            : new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
          {' '}— {selectedSubjects.length} revisão{selectedSubjects.length !== 1 ? 'ões' : ''}
        </p>

        {selectedSubjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-border">
            <p className="text-muted-light text-xs font-black uppercase tracking-[0.25em]">
              {selectedIsPast ? 'Nenhuma revisão registrada' : 'Nenhuma revisão agendada'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedSubjects.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center justify-between hover:border-navy/20 transition-colors shadow-sm"
              >
                <div>
                  <p className="text-navy font-bold text-sm">{s.aulaPrincipal}</p>
                  <p className="text-muted text-[10px] font-black uppercase tracking-widest mt-0.5">
                    {s.area} • {s.modulo}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    selectedIsPast
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : selectedDay === todayStr
                      ? 'bg-yellow/20 text-yellow-700 border border-yellow/30'
                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}>
                    {selectedIsPast ? 'Atrasado' : selectedDay === todayStr ? 'Hoje' : 'Agendado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
