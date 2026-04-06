import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ExamEntryPayload } from '../services/api';
import { Plus, X, ChevronRight, FileText } from 'lucide-react';

const EXAM_TYPES = ['Prova na íntegra', 'Simulado', 'Lista de exercícios', 'Outro'];

function scoreLabel(pct: number): { text: string; cls: string } {
  if (pct >= 85) return { text: 'Excelente',    cls: 'bg-green-50 text-green-700 border-green-200' };
  if (pct >= 70) return { text: 'Suficiente',   cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (pct >= 60) return { text: 'Regular',      cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
  return            { text: 'Insuficiente', cls: 'bg-red-50 text-red-600 border-red-200' };
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const emptyForm = () => ({
  examDate: new Date().toISOString().slice(0, 10),
  examName: '',
  examType: 'Prova na íntegra',
  scorePercent: '',
  notes: '',
});

export function Provas() {
  const [entries, setEntries] = useState<ExamEntryPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExamEntryPayload | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ExamEntryPayload | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    api.examEntries.list()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditingEntry(null);
    setForm(emptyForm());
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (entry: ExamEntryPayload) => {
    setEditingEntry(entry);
    setForm({
      examDate: entry.examDate,
      examName: entry.examName,
      examType: entry.examType ?? 'Prova na íntegra',
      scorePercent: String(entry.scorePercent),
      notes: entry.notes ?? '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    const score = Number(form.scorePercent);
    if (!form.examDate) { setFormError('Informe a data.'); return; }
    if (!form.examName.trim()) { setFormError('Informe o nome da prova.'); return; }
    if (isNaN(score) || score < 0 || score > 100) { setFormError('% de acerto deve ser entre 0 e 100.'); return; }

    setSaving(true);
    try {
      const payload = {
        examDate: form.examDate,
        examName: form.examName.trim(),
        examType: form.examType || undefined,
        scorePercent: score,
        notes: form.notes.trim() || undefined,
      };

      if (editingEntry) {
        const updated = await api.examEntries.update(editingEntry.id!, payload);
        setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
        if (selectedEntry?.id === updated.id) setSelectedEntry(updated);
      } else {
        const created = await api.examEntries.create(payload);
        setEntries(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await api.examEntries.delete(id).catch(console.error);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  const openDetail = (entry: ExamEntryPayload) => {
    setSelectedEntry(entry);
    setNotesValue(entry.notes ?? '');
  };

  const saveNotes = async () => {
    if (!selectedEntry) return;
    setNotesSaving(true);
    try {
      const updated = await api.examEntries.update(selectedEntry.id!, { notes: notesValue });
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelectedEntry(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setNotesSaving(false);
    }
  };

  const inputCls = "w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20";
  const labelCls = "block text-[9px] font-black text-muted-light uppercase tracking-widest mb-1.5";

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Main list ─────────────────────────────────────────────── */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-4 ${selectedEntry ? 'hidden md:block' : ''}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Provas</h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-navy text-white py-2 px-4 rounded-full text-[10px] font-black uppercase hover:bg-navy-light transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Prova
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-light text-xs font-black uppercase tracking-[0.2em]">Carregando...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FileText className="w-10 h-10 text-navy/20" />
            <p className="text-muted-light text-xs font-black uppercase tracking-[0.2em]">Nenhuma prova registrada</p>
            <button onClick={openCreate} className="text-navy text-xs font-black hover:underline">+ Registrar primeira prova</button>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[9px] font-black text-muted-light uppercase tracking-widest px-5 py-3">Data</th>
                  <th className="text-left text-[9px] font-black text-muted-light uppercase tracking-widest px-5 py-3">Prova</th>
                  <th className="text-left text-[9px] font-black text-muted-light uppercase tracking-widest px-5 py-3 hidden sm:table-cell">Tipo</th>
                  <th className="text-right text-[9px] font-black text-muted-light uppercase tracking-widest px-5 py-3">% Acerto</th>
                  <th className="text-left text-[9px] font-black text-muted-light uppercase tracking-widest px-5 py-3 hidden sm:table-cell">Resultado</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const { text, cls } = scoreLabel(e.scorePercent);
                  return (
                    <tr
                      key={e.id}
                      onClick={() => openDetail(e)}
                      className={`border-b border-border/50 last:border-0 cursor-pointer hover:bg-surface transition-colors ${selectedEntry?.id === e.id ? 'bg-navy/5' : ''}`}
                    >
                      <td className="px-5 py-3.5 text-navy font-bold text-xs whitespace-nowrap">{fmtDate(e.examDate)}</td>
                      <td className="px-5 py-3.5 text-navy font-bold text-sm max-w-[180px] truncate">{e.examName}</td>
                      <td className="px-5 py-3.5 text-muted text-xs hidden sm:table-cell">{e.examType ?? '—'}</td>
                      <td className="px-5 py-3.5 text-right font-black text-navy">{e.scorePercent}%</td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${cls}`}>{text}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <ChevronRight className="w-4 h-4 text-muted-light" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail side panel ──────────────────────────────────────── */}
      {selectedEntry && (
        <div className="w-full md:w-96 border-l border-border bg-white flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <p className="font-black text-navy text-sm uppercase tracking-tight truncate mr-2">{selectedEntry.examName}</p>
            <button onClick={() => setSelectedEntry(null)} className="p-1 text-muted-light hover:text-navy transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Score + result */}
            <div className="bg-surface rounded-2xl border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-muted-light uppercase tracking-widest mb-1">Aproveitamento</p>
                <p className="text-4xl font-black text-navy">{selectedEntry.scorePercent}%</p>
              </div>
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border uppercase tracking-wider ${scoreLabel(selectedEntry.scorePercent).cls}`}>
                {scoreLabel(selectedEntry.scorePercent).text}
              </span>
            </div>

            {/* Meta */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[9px] font-black text-muted-light uppercase tracking-widest">Data</span>
                <span className="font-bold text-navy text-xs">{fmtDate(selectedEntry.examDate)}</span>
              </div>
              {selectedEntry.examType && (
                <div className="flex justify-between text-sm">
                  <span className="text-[9px] font-black text-muted-light uppercase tracking-widest">Tipo</span>
                  <span className="font-bold text-navy text-xs">{selectedEntry.examType}</span>
                </div>
              )}
            </div>

            {/* Caderno de erros */}
            <div className="space-y-2">
              <p className="text-[9px] font-black text-muted-light uppercase tracking-widest">Caderno de Erros</p>
              <textarea
                value={notesValue}
                onChange={e => setNotesValue(e.target.value)}
                rows={8}
                placeholder="Anote aqui os tópicos errados, dúvidas e pontos a revisar..."
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none"
              />
              <button
                onClick={saveNotes}
                disabled={notesSaving || notesValue === (selectedEntry.notes ?? '')}
                className="w-full py-2.5 bg-navy text-white text-[10px] font-black uppercase rounded-xl hover:bg-navy-light transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {notesSaving ? 'Salvando...' : 'Salvar Notas'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-5 py-4 border-t border-border shrink-0">
            <button
              onClick={() => openEdit(selectedEntry)}
              className="flex-1 py-2.5 border border-border rounded-xl text-[10px] font-black text-navy uppercase hover:bg-surface transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(selectedEntry.id!)}
              className="flex-1 py-2.5 border border-red-200 rounded-xl text-[10px] font-black text-red-600 uppercase hover:bg-red-50 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      )}

      {/* ── Create / Edit modal ────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white border border-border rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h4 className="text-xl font-black text-navy mb-6 uppercase tracking-tight">
              {editingEntry ? 'Editar Prova' : 'Nova Prova'}
            </h4>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Data</label>
                  <input type="date" value={form.examDate}
                    onChange={e => setForm({ ...form, examDate: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>% de Acerto</label>
                  <input type="number" min={0} max={100} value={form.scorePercent}
                    onChange={e => setForm({ ...form, scorePercent: e.target.value })}
                    placeholder="0–100"
                    className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Nome da Prova</label>
                <input type="text" value={form.examName}
                  onChange={e => setForm({ ...form, examName: e.target.value })}
                  placeholder="Ex: ENEM 2025 — Caderno Azul"
                  className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Tipo</label>
                <select value={form.examType}
                  onChange={e => setForm({ ...form, examType: e.target.value })}
                  className={inputCls}>
                  {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {formError && (
                <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-4 text-muted text-[10px] font-black uppercase hover:text-navy transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-navy text-white py-4 rounded-full text-[10px] font-black uppercase hover:bg-navy-light transition-all shadow-md active:scale-95 disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
