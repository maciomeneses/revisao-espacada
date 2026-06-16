import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCatalog } from '../hooks/useCatalog';
import type { Area, Discipline, Subject } from '../types';

interface GerenciarCategoriasProps {
  subjects: Subject[];
}

/**
 * Tela de CRUD de áreas e disciplinas do usuário.
 * Exibe contagem de disciplinas/assuntos afetados na confirmação de exclusão
 * para deixar claro o escopo do cascade.
 */
export function GerenciarCategorias({ subjects }: GerenciarCategoriasProps) {
  const {
    areas,
    disciplines,
    loading,
    error,
    clearError,
    createArea,
    renameArea,
    deleteArea,
    createDiscipline,
    renameDiscipline,
    deleteDiscipline,
  } = useCatalog();

  const [newAreaName, setNewAreaName] = useState('');
  const [newDiscipline, setNewDiscipline] = useState<{ areaId: number | ''; name: string }>({
    areaId: '',
    name: '',
  });
  const [editing, setEditing] = useState<{
    kind: 'area' | 'discipline';
    id: number;
    draft: string;
  } | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: 'area'; id: number; name: string; disciplineCount: number; subjectCount: number }
    | { kind: 'discipline'; id: number; name: string; subjectCount: number }
    | null
  >(null);

  const disciplinesByArea = useMemo(() => {
    const map = new Map<number, Discipline[]>();
    disciplines.forEach((d) => {
      if (!map.has(d.areaId)) map.set(d.areaId, []);
      map.get(d.areaId)!.push(d);
    });
    return map;
  }, [disciplines]);

  const countSubjectsForArea = (area: Area) => subjects.filter((s) => s.area === area.name).length;

  const countSubjectsForDiscipline = (d: Discipline) =>
    subjects.filter(
      (s) =>
        s.area === (d.areaName ?? areas.find((a) => a.id === d.areaId)?.name) &&
        s.modulo === d.name,
    ).length;

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newAreaName.trim();
    if (!trimmed) return;
    const created = await createArea(trimmed);
    if (created) setNewAreaName('');
  };

  const handleCreateDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDiscipline.name.trim();
    if (!trimmed || newDiscipline.areaId === '') return;
    const created = await createDiscipline(Number(newDiscipline.areaId), trimmed);
    if (created) setNewDiscipline({ areaId: newDiscipline.areaId, name: '' });
  };

  const confirmDeleteArea = (area: Area) => {
    const disciplineCount = (disciplinesByArea.get(area.id) ?? []).length;
    const subjectCount = countSubjectsForArea(area);
    setConfirm({ kind: 'area', id: area.id, name: area.name, disciplineCount, subjectCount });
  };

  const confirmDeleteDiscipline = (d: Discipline) => {
    setConfirm({
      kind: 'discipline',
      id: d.id,
      name: d.name,
      subjectCount: countSubjectsForDiscipline(d),
    });
  };

  const executeDelete = async () => {
    if (!confirm) return;
    const ok =
      confirm.kind === 'area' ? await deleteArea(confirm.id) : await deleteDiscipline(confirm.id);
    if (ok) setConfirm(null);
  };

  const saveRename = async () => {
    if (!editing) return;
    const trimmed = editing.draft.trim();
    if (!trimmed) return;
    const ok =
      editing.kind === 'area'
        ? await renameArea(editing.id, trimmed)
        : await renameDiscipline(editing.id, trimmed);
    if (ok) setEditing(null);
  };

  const inputClass =
    'flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20';

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Categorias</h2>
        <span className="text-muted text-[10px] font-black uppercase tracking-widest bg-white border border-border py-1 px-3 rounded-full">
          Áreas e Disciplinas
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start justify-between gap-3">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
            aria-label="Fechar erro"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-muted text-sm">Carregando...</p>
      ) : (
        <>
          {/* Criar nova área */}
          <section className="bg-white border border-border rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-[10px] font-black text-navy uppercase tracking-widest">
              Nova área
            </h3>
            <form onSubmit={handleCreateArea} className="flex gap-3">
              <input
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Ex: Redação"
                maxLength={120}
                className={inputClass}
                aria-label="Nome da nova área"
              />
              <button
                type="submit"
                disabled={!newAreaName.trim()}
                className="bg-navy text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-navy-light transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <Plus size={14} /> Adicionar
              </button>
            </form>
          </section>

          {/* Criar nova disciplina */}
          <section className="bg-white border border-border rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-[10px] font-black text-navy uppercase tracking-widest">
              Nova disciplina
            </h3>
            <form onSubmit={handleCreateDiscipline} className="flex gap-3 flex-wrap">
              <select
                value={newDiscipline.areaId === '' ? '' : String(newDiscipline.areaId)}
                onChange={(e) =>
                  setNewDiscipline({
                    ...newDiscipline,
                    areaId: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
                className={`${inputClass} min-w-[200px]`}
                aria-label="Área da nova disciplina"
              >
                <option value="">Selecionar área...</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <input
                value={newDiscipline.name}
                onChange={(e) => setNewDiscipline({ ...newDiscipline, name: e.target.value })}
                placeholder="Ex: Redação Dissertativa"
                maxLength={120}
                disabled={newDiscipline.areaId === ''}
                className={`${inputClass} disabled:opacity-40`}
                aria-label="Nome da nova disciplina"
              />
              <button
                type="submit"
                disabled={newDiscipline.areaId === '' || !newDiscipline.name.trim()}
                className="bg-navy text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-navy-light transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <Plus size={14} /> Adicionar
              </button>
            </form>
          </section>

          {/* Lista de áreas com suas disciplinas */}
          {areas.length === 0 ? (
            <p className="text-muted text-sm bg-white border border-border rounded-2xl p-6 text-center">
              Nenhuma área cadastrada ainda.
            </p>
          ) : (
            <div className="space-y-4">
              {areas.map((area) => {
                const areaDisciplines = disciplinesByArea.get(area.id) ?? [];
                const isEditingArea = editing?.kind === 'area' && editing.id === area.id;
                return (
                  <section
                    key={area.id}
                    className="bg-white border border-border rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      {isEditingArea ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            autoFocus
                            value={editing.draft}
                            onChange={(e) => setEditing({ ...editing, draft: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRename();
                              else if (e.key === 'Escape') setEditing(null);
                            }}
                            className={inputClass}
                            aria-label="Editar nome da área"
                          />
                          <button
                            onClick={saveRename}
                            className="text-[10px] font-black bg-navy text-white px-3 rounded-xl uppercase tracking-widest"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-[10px] text-muted hover:text-navy"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-black text-navy">{area.name}</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setEditing({ kind: 'area', id: area.id, draft: area.name })
                              }
                              className="p-2 text-muted hover:text-navy transition-colors"
                              aria-label={`Renomear área ${area.name}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => confirmDeleteArea(area)}
                              className="p-2 text-muted-light hover:text-red-500 transition-colors"
                              aria-label={`Excluir área ${area.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {areaDisciplines.length === 0 ? (
                      <p className="text-muted-light text-xs italic">Sem disciplinas.</p>
                    ) : (
                      <ul className="divide-y divide-border -mx-2">
                        {areaDisciplines.map((d) => {
                          const isEditingDiscipline =
                            editing?.kind === 'discipline' && editing.id === d.id;
                          return (
                            <li
                              key={d.id}
                              className="flex items-center justify-between gap-2 px-2 py-2"
                            >
                              {isEditingDiscipline ? (
                                <div className="flex-1 flex gap-2">
                                  <input
                                    autoFocus
                                    value={editing.draft}
                                    onChange={(e) =>
                                      setEditing({ ...editing, draft: e.target.value })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveRename();
                                      else if (e.key === 'Escape') setEditing(null);
                                    }}
                                    className={inputClass}
                                    aria-label="Editar nome da disciplina"
                                  />
                                  <button
                                    onClick={saveRename}
                                    className="text-[10px] font-black bg-navy text-white px-3 rounded-xl uppercase tracking-widest"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={() => setEditing(null)}
                                    className="text-[10px] text-muted hover:text-navy"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-sm text-navy">{d.name}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        setEditing({ kind: 'discipline', id: d.id, draft: d.name })
                                      }
                                      className="p-1.5 text-muted hover:text-navy transition-colors"
                                      aria-label={`Renomear disciplina ${d.name}`}
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => confirmDeleteDiscipline(d)}
                                      className="p-1.5 text-muted-light hover:text-red-500 transition-colors"
                                      aria-label={`Excluir disciplina ${d.name}`}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      {confirm && (
        <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
          <div className="bg-white border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h4 className="text-xl font-black text-navy mb-2">Confirmar exclusão</h4>
            <p className="text-muted text-sm mb-4">
              Excluir {confirm.kind === 'area' ? 'a área' : 'a disciplina'}{' '}
              <strong className="text-navy">{confirm.name}</strong>?
            </p>
            {confirm.kind === 'area' &&
              (confirm.disciplineCount > 0 || confirm.subjectCount > 0) && (
                <p className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs mb-4">
                  Também serão removidos <strong>{confirm.disciplineCount}</strong> disciplina(s) e{' '}
                  <strong>{confirm.subjectCount}</strong> assunto(s).
                </p>
              )}
            {confirm.kind === 'discipline' && confirm.subjectCount > 0 && (
              <p className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs mb-4">
                Também serão removidos <strong>{confirm.subjectCount}</strong> assunto(s)
                vinculado(s).
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-3 text-muted text-[10px] font-black uppercase hover:text-navy transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 bg-red-600 text-white py-3 rounded-full text-[10px] font-black uppercase hover:bg-red-700 transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
