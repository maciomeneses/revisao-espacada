import { useState, useMemo } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { Subject, Relevance } from '../types';

interface GerenciarConteudoProps {
  subjects: Subject[];
  onAdd: (data: { area: string; modulo: string; aulaPrincipal: string; relevancia: Relevance }) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const RELEVANCES: Relevance[] = ['Alta', 'Média', 'Baixa'];

export function GerenciarConteudo({ subjects, onAdd, onRemove, onClose }: GerenciarConteudoProps) {
  const [tab, setTab] = useState<'adicionar' | 'gerenciar'>('adicionar');
  const [areaSelect, setAreaSelect] = useState('');
  const [novaArea, setNovaArea] = useState('');
  const [modulo, setModulo] = useState('');
  const [aulaPrincipal, setAulaPrincipal] = useState('');
  const [relevancia, setRelevancia] = useState<Relevance>('Alta');
  const [successMsg, setSuccessMsg] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const areas = useMemo(() => Array.from(new Set(subjects.map((s) => s.area))).sort(), [subjects]);
  const byArea = useMemo(() => {
    const map: Record<string, Subject[]> = {};
    for (const s of subjects) {
      if (!map[s.area]) map[s.area] = [];
      map[s.area].push(s);
    }
    return map;
  }, [subjects]);

  const effectiveArea = areaSelect === '__nova__' ? novaArea.trim() : areaSelect;
  const autoModulo = useMemo(() => {
    if (!effectiveArea) return '';
    const count = subjects.filter((s) => s.area === effectiveArea).length;
    return `${effectiveArea} ${String(count + 1).padStart(3, '0')}`;
  }, [effectiveArea, subjects]);

  function handleAdd() {
    const area = effectiveArea;
    const mod  = modulo.trim() || autoModulo;
    const aula = aulaPrincipal.trim();
    if (!area || !aula) return;
    onAdd({ area, modulo: mod, aulaPrincipal: aula, relevancia });
    setAreaSelect(''); setNovaArea(''); setModulo(''); setAulaPrincipal(''); setRelevancia('Alta');
    setSuccessMsg(`"${aula}" adicionado com sucesso!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  function handleRemoveArea(area: string) {
    if (!confirm(`Remover todos os módulos da área "${area}"? Essa ação não pode ser desfeita.`)) return;
    for (const s of byArea[area] ?? []) onRemove(s.id);
  }

  function toggleCollapse(area: string) {
    setCollapsed((prev) => ({ ...prev, [area]: !prev[area] }));
  }

  const inputClass = "w-full bg-surface-alt border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm text-navy placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-sky/40 transition-all";
  const labelClass = "text-xs font-semibold text-navy uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-navy/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-lg bg-white border-l border-[#e2e8f0] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
          <h2 className="text-navy font-bold text-base">Gerenciar Conteúdo</h2>
          <button onClick={onClose} className="text-muted-light hover:text-navy transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e2e8f0]">
          {(['adicionar', 'gerenciar'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors capitalize ${
                tab === t
                  ? 'text-navy border-b-2 border-navy'
                  : 'text-muted hover:text-navy'
              }`}
            >
              {t === 'adicionar' ? 'Adicionar' : 'Remover'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'adicionar' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted">Preencha os campos para adicionar um novo módulo ao cronograma.</p>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Área</label>
                <select
                  value={areaSelect}
                  onChange={(e) => { setAreaSelect(e.target.value); setModulo(''); }}
                  className={inputClass}
                >
                  <option value="">Selecione uma área...</option>
                  {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                  <option value="__nova__">+ Nova área...</option>
                </select>
              </div>

              {areaSelect === '__nova__' && (
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Nome da nova área</label>
                  <input
                    type="text"
                    value={novaArea}
                    onChange={(e) => { setNovaArea(e.target.value.toUpperCase()); setModulo(''); }}
                    placeholder="ex: FILOSOFIA"
                    className={inputClass}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  Módulo <span className="text-muted normal-case font-normal">(opcional — sugerido: {autoModulo || '—'})</span>
                </label>
                <input
                  type="text"
                  value={modulo}
                  onChange={(e) => setModulo(e.target.value)}
                  placeholder={autoModulo || 'ex: FÍSICA 015'}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Aula Principal <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={aulaPrincipal}
                  onChange={(e) => setAulaPrincipal(e.target.value)}
                  placeholder="ex: Leis de Newton"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Relevância</label>
                <div className="flex gap-2">
                  {RELEVANCES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRelevancia(r)}
                      className={`flex-1 py-2 rounded-full text-sm font-semibold border transition-colors ${
                        relevancia === r
                          ? r === 'Alta'
                            ? 'bg-red-600 border-red-600 text-white'
                            : r === 'Média'
                              ? 'border-yellow-500 text-white'
                              : 'bg-sky border-sky text-white'
                          : 'bg-surface-alt border-[#e2e8f0] text-muted hover:border-[#cbd5e1]'
                      }`}
                      style={relevancia === r && r === 'Média' ? { backgroundColor: '#b8860b' } : undefined}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!effectiveArea || !aulaPrincipal.trim()}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full font-bold disabled:opacity-40 disabled:cursor-default transition-colors mt-1 shadow-sm"
                style={{ backgroundColor: '#FFC72C', color: '#1F3A5F' }}
              >
                <Plus size={15} />
                Adicionar Módulo
              </button>

              {successMsg && <p className="text-green-600 text-xs text-center">{successMsg}</p>}
            </div>
          )}

          {tab === 'gerenciar' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted mb-2">
                {subjects.length} módulos no total.
              </p>
              {areas.map((area) => {
                const list   = byArea[area] ?? [];
                const isOpen = !collapsed[area];
                return (
                  <div key={area} className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2.5 bg-surface-alt">
                      <button
                        className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-navy-light flex-1 text-left"
                        onClick={() => toggleCollapse(area)}
                      >
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {area}
                        <span className="text-xs text-muted font-normal">({list.length})</span>
                      </button>
                      <button
                        onClick={() => handleRemoveArea(area)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors"
                      >
                        Remover área
                      </button>
                    </div>

                    {isOpen && (
                      <div className="divide-y divide-[#e2e8f0]">
                        {list.map((s) => (
                          <div key={s.id} className="flex items-center justify-between px-3 py-2 hover:bg-surface transition-colors">
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs text-muted">{s.modulo}</span>
                              <span className="text-sm text-navy truncate">{s.aulaPrincipal}</span>
                            </div>
                            <button
                              onClick={() => { if (confirm(`Remover "${s.aulaPrincipal}"?`)) onRemove(s.id); }}
                              className="ml-3 p-1.5 text-muted-light hover:text-red-500 transition-colors shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
