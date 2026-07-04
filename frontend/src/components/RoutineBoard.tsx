import { useEffect, useState } from 'react';
import { Plus, X, Pencil } from 'lucide-react';
import type { RoutineSlot, StudentRoutine } from '../types';

interface RoutineBoardProps {
  routine: StudentRoutine;
  availableAreas: string[];
  onAdd: (slot: Omit<RoutineSlot, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Omit<RoutineSlot, 'id'>>) => void;
  onRemove: (id: string) => void;
  allowedDays: Set<number>;
  onToggleDay: (day: number) => void;
  maxReviewsPerDay: number | null;
  onSetMaxReviewsPerDay: (max: number | null) => void;
}

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DAY_INDEX = [1, 2, 3, 4, 5, 6, 0]; // maps column 0–6 to dayOfWeek

// Toggles "permitir revisões". Ordem domingo..sábado, índices 0..6.
const ALLOWED_DAY_TOGGLES: ReadonlyArray<{ day: number; label: string }> = [
  { day: 0, label: 'D' },
  { day: 1, label: 'S' },
  { day: 2, label: 'T' },
  { day: 3, label: 'Q' },
  { day: 4, label: 'Q' },
  { day: 5, label: 'S' },
  { day: 6, label: 'S' },
];

interface SlotFormState {
  title: string;
  startTime: string;
  endTime: string;
  type: 'study' | 'other';
  area: string;
}

const emptyForm = (): SlotFormState => ({
  title: '',
  startTime: '',
  endTime: '',
  type: 'study',
  area: '',
});

type ModalMode =
  | { kind: 'closed' }
  | { kind: 'add'; dayOfWeek: number }
  | { kind: 'edit'; slot: RoutineSlot };

export function RoutineBoard({
  routine,
  availableAreas,
  onAdd,
  onUpdate,
  onRemove,
  allowedDays,
  onToggleDay,
  maxReviewsPerDay,
  onSetMaxReviewsPerDay,
}: RoutineBoardProps) {
  const [modal, setModal] = useState<ModalMode>({ kind: 'closed' });
  const [form, setForm] = useState<SlotFormState>(emptyForm());
  const [maxDraft, setMaxDraft] = useState<string>(maxReviewsPerDay?.toString() ?? '');

  // Mantém o rascunho em sincronia quando o valor persistido muda (fetch do
  // backend após o mount, rollback de falha de rede).
  useEffect(() => {
    setMaxDraft(maxReviewsPerDay?.toString() ?? '');
  }, [maxReviewsPerDay]);

  function commitMaxDraft() {
    const trimmed = maxDraft.trim();
    if (trimmed === '') {
      if (maxReviewsPerDay !== null) onSetMaxReviewsPerDay(null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setMaxDraft(maxReviewsPerDay?.toString() ?? '');
      return;
    }
    if (parsed !== maxReviewsPerDay) onSetMaxReviewsPerDay(parsed);
  }

  function openAdd(dayOfWeek: number) {
    setForm(emptyForm());
    setModal({ kind: 'add', dayOfWeek });
  }

  function openEdit(slot: RoutineSlot) {
    setForm({
      title: slot.title,
      startTime: slot.startTime ?? '',
      endTime: slot.endTime ?? '',
      type: slot.type,
      area: slot.area ?? '',
    });
    setModal({ kind: 'edit', slot });
  }

  function closeModal() {
    setModal({ kind: 'closed' });
  }

  function handleSubmit() {
    if (!form.title.trim()) return;
    const payload: Omit<RoutineSlot, 'id'> = {
      title: form.title.trim(),
      type: form.type,
      ...(form.startTime && { startTime: form.startTime }),
      ...(form.endTime && { endTime: form.endTime }),
      ...(form.type === 'study' && form.area && { area: form.area }),
      dayOfWeek:
        modal.kind === 'add'
          ? modal.dayOfWeek
          : (modal as { kind: 'edit'; slot: RoutineSlot }).slot.dayOfWeek,
    };
    if (modal.kind === 'add') {
      onAdd(payload);
    } else if (modal.kind === 'edit') {
      onUpdate(modal.slot.id, payload);
    }
    closeModal();
  }

  function slotsForDay(dayOfWeek: number): RoutineSlot[] {
    return routine.filter((s) => s.dayOfWeek === dayOfWeek);
  }

  return (
    <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-base font-semibold text-navy">Rotina Semanal</h2>
        <p className="mt-1 text-sm text-navy/60">
          Defina sua rotina de estudos para que o algoritmo saiba em quais dias você estuda cada
          matéria — assim as revisões serão agendadas nos dias certos.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-2">
            Dias em que o algoritmo pode marcar revisões
          </p>
          <div className="flex gap-1.5">
            {ALLOWED_DAY_TOGGLES.map(({ day, label }, idx) => {
              const active = allowedDays.has(day);
              const isLastActive = active && allowedDays.size <= 1;
              return (
                <button
                  key={`${day}-${idx}`}
                  type="button"
                  onClick={() => onToggleDay(day)}
                  disabled={isLastActive}
                  aria-pressed={active}
                  title={active ? 'Permitir revisões neste dia' : 'Não fazer revisões neste dia'}
                  className={`w-9 h-9 rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-navy text-white hover:bg-navy/90'
                      : 'bg-gray-200 text-gray-400 line-through hover:bg-gray-300'
                  } ${isLastActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-2">
            Limite de revisões por dia
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={maxDraft}
              onChange={(e) => setMaxDraft(e.target.value)}
              onBlur={commitMaxDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="Sem limite"
              aria-label="Limite de revisões por dia"
              className="w-28 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
            <span className="text-xs text-navy/50">
              Deixe vazio para não limitar. Dias cheios empurram novas revisões para o próximo dia
              permitido com vaga.
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <div className="grid grid-cols-7 gap-2 min-w-[560px]">
          {DAYS.map((label, colIdx) => {
            const dayOfWeek = DAY_INDEX[colIdx];
            const slots = slotsForDay(dayOfWeek);
            return (
              <div key={dayOfWeek} className="flex flex-col gap-1.5">
                <div className="text-xs font-semibold text-navy/50 text-center pb-1">{label}</div>
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`rounded-xl px-2 py-1.5 text-xs border group relative ${
                      slot.type === 'study'
                        ? 'bg-sky-50 border-sky-200 text-sky-800'
                        : 'bg-surface border-border text-navy/70'
                    }`}
                  >
                    <div className="font-medium truncate pr-8">{slot.title}</div>
                    {slot.type === 'study' && slot.area && (
                      <div className="mt-0.5 text-[10px] text-sky-600 truncate">{slot.area}</div>
                    )}
                    {slot.startTime && (
                      <div className="mt-0.5 text-[10px] text-navy/40">
                        {slot.startTime}
                        {slot.endTime ? `–${slot.endTime}` : ''}
                      </div>
                    )}
                    <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                      <button
                        onClick={() => openEdit(slot)}
                        className="p-0.5 rounded hover:bg-black/10 transition-colors"
                        aria-label="Editar"
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={() => onRemove(slot.id)}
                        className="p-0.5 rounded hover:bg-black/10 transition-colors"
                        aria-label="Remover"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => openAdd(dayOfWeek)}
                  className="flex items-center justify-center w-full rounded-xl border border-dashed border-border py-1.5 text-navy/30 hover:text-navy/60 hover:border-navy/30 transition-colors"
                  aria-label={`Adicionar slot em ${label}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {modal.kind !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy text-sm">
                {modal.kind === 'add' ? 'Novo slot' : 'Editar slot'}
              </h3>
              <button
                onClick={closeModal}
                className="text-navy/40 hover:text-navy/70 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-navy/60 mb-1 block">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Matemática, Corrida..."
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-navy/60 mb-1 block">Início (opcional)</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-navy/60 mb-1 block">Fim (opcional)</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-navy/60 mb-1 block">Tipo</label>
                <div className="flex rounded-xl border border-border overflow-hidden">
                  {(['study', 'other'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`flex-1 py-2 text-sm transition-colors ${
                        form.type === t
                          ? 'bg-navy text-white font-medium'
                          : 'bg-surface text-navy/60 hover:text-navy'
                      }`}
                    >
                      {t === 'study' ? 'Estudo' : 'Outro'}
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'study' && availableAreas.length > 0 && (
                <div>
                  <label className="text-xs text-navy/60 mb-1 block">Área (opcional)</label>
                  <select
                    value={form.area}
                    onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  >
                    <option value="">Sem área específica</option>
                    {availableAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={closeModal}
                className="flex-1 py-2 rounded-xl border border-border text-sm text-navy/60 hover:text-navy transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.title.trim()}
                className="flex-1 py-2 rounded-xl bg-navy text-white text-sm font-medium disabled:opacity-40 hover:bg-navy/90 transition-colors"
              >
                {modal.kind === 'add' ? 'Adicionar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
