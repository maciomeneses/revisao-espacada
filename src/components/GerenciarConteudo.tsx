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

  // Form state
  const [areaSelect, setAreaSelect] = useState('');
  const [novaArea, setNovaArea] = useState('');
  const [modulo, setModulo] = useState('');
  const [aulaPrincipal, setAulaPrincipal] = useState('');
  const [relevancia, setRelevancia] = useState<Relevance>('Alta');
  const [successMsg, setSuccessMsg] = useState('');

  // Collapse state per area in "gerenciar" tab
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const areas = useMemo(() => {
    const set = new Set(subjects.map((s) => s.area));
    return Array.from(set).sort();
  }, [subjects]);

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
    const num = String(count + 1).padStart(3, '0');
    return `${effectiveArea} ${num}`;
  }, [effectiveArea, subjects]);

  function handleAdd() {
    const area = effectiveArea;
    const mod = modulo.trim() || autoModulo;
    const aula = aulaPrincipal.trim();
    if (!area || !aula) return;
    onAdd({ area, modulo: mod, aulaPrincipal: aula, relevancia });
    setAreaSelect('');
    setNovaArea('');
    setModulo('');
    setAulaPrincipal('');
    setRelevancia('Alta');
    setSuccessMsg(`"${aula}" adicionado com sucesso!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  function handleRemoveArea(area: string) {
    if (!confirm(`Remover todos os módulos da área "${area}"? Essa ação não pode ser desfeita.`)) return;
    for (const s of byArea[area] ?? []) {
      onRemove(s.id);
    }
  }

  function toggleCollapse(area: string) {
    setCollapsed((prev) => ({ ...prev, [area]: !prev[area] }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-lg bg-[#141414] border-l border-[#2a2a2a] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-white font-semibold text-base">Gerenciar Conteúdo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2a2a2a]">
          {(['adicionar', 'gerenciar'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? 'text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
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
              <p className="text-xs text-gray-500">Preencha os campos para adicionar um novo módulo ao cronograma.</p>

              {/* Área */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400">Área</label>
                <select
                  value={areaSelect}
                  onChange={(e) => { setAreaSelect(e.target.value); setModulo(''); }}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione uma área...</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                  <option value="__nova__">+ Nova área...</option>
                </select>
              </div>

              {/* Nova área input */}
              {areaSelect === '__nova__' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400">Nome da nova área</label>
                  <input
                    type="text"
                    value={novaArea}
                    onChange={(e) => { setNovaArea(e.target.value.toUpperCase()); setModulo(''); }}
                    placeholder="ex: FILOSOFIA"
                    className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Módulo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400">
                  Módulo <span className="text-gray-600">(opcional — sugerido: {autoModulo || '—'})</span>
                </label>
                <input
                  type="text"
                  value={modulo}
                  onChange={(e) => setModulo(e.target.value)}
                  placeholder={autoModulo || 'ex: FÍSICA 015'}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Aula Principal */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400">Aula Principal <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={aulaPrincipal}
                  onChange={(e) => setAulaPrincipal(e.target.value)}
                  placeholder="ex: Leis de Newton"
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Relevância */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400">Relevância</label>
                <div className="flex gap-2">
                  {RELEVANCES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRelevancia(r)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        relevancia === r
                          ? r === 'Alta'
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : r === 'Média'
                              ? 'bg-yellow-600/80 border-yellow-600 text-white'
                              : 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:border-[#555]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleAdd}
                disabled={!effectiveArea || !aulaPrincipal.trim()}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-default text-white text-sm font-medium transition-colors mt-1"
              >
                <Plus size={15} />
                Adicionar Módulo
              </button>

              {successMsg && (
                <p className="text-green-400 text-xs text-center">{successMsg}</p>
              )}
            </div>
          )}

          {tab === 'gerenciar' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500 mb-2">
                {subjects.length} módulos no total. Clique na lixeira para remover individualmente ou use "Remover área" para apagar todos de uma área.
              </p>
              {areas.map((area) => {
                const list = byArea[area] ?? [];
                const isOpen = !collapsed[area];
                return (
                  <div key={area} className="border border-[#2a2a2a] rounded-lg overflow-hidden">
                    {/* Area header */}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-[#1a1a1a]">
                      <button
                        className="flex items-center gap-2 text-sm font-medium text-gray-200 hover:text-white flex-1 text-left"
                        onClick={() => toggleCollapse(area)}
                      >
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {area}
                        <span className="text-xs text-gray-500 font-normal">({list.length})</span>
                      </button>
                      <button
                        onClick={() => handleRemoveArea(area)}
                        className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded transition-colors"
                        title={`Remover área ${area}`}
                      >
                        Remover área
                      </button>
                    </div>

                    {/* Subjects list */}
                    {isOpen && (
                      <div className="divide-y divide-[#222]">
                        {list.map((s) => (
                          <div key={s.id} className="flex items-center justify-between px-3 py-2">
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs text-gray-500">{s.modulo}</span>
                              <span className="text-sm text-gray-200 truncate">{s.aulaPrincipal}</span>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm(`Remover "${s.aulaPrincipal}"?`)) onRemove(s.id);
                              }}
                              className="ml-3 p-1.5 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                              title="Remover módulo"
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
