import { useState, useEffect, useMemo } from 'react';
import type { Subject } from '../types';
import { api } from '../services/api';
import type { SubjectTemplatePayload } from '../services/api';

interface GerenciarConteudoProps {
  subjects: Subject[];
  onAdd: (subject: Partial<Subject>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const AREAS = [
  'Ciências da Natureza',
  'Matemática e suas Tecnologias',
  'Ciências Humanas',
  'Linguagens e Códigos',
] as const;

const DISCIPLINAS_BY_AREA: Record<string, string[]> = {
  'Ciências da Natureza':          ['Biologia', 'Física', 'Química'],
  'Matemática e suas Tecnologias': ['Matemática'],
  'Ciências Humanas':              ['Filosofia', 'Geografia', 'História', 'Sociologia'],
  'Linguagens e Códigos':          ['Linguagens'],
};

// Disciplinas com apenas 1 opção são auto-selecionadas
const AUTO_DISCIPLINA: Record<string, string> = {
  'Matemática e suas Tecnologias': 'Matemática',
  'Linguagens e Códigos':          'Linguagens',
};

const NEW_VALUE = '__new__';

export function GerenciarConteudo({ subjects, onAdd, onRemove, onClose }: GerenciarConteudoProps) {
  const [area, setArea] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [templates, setTemplates] = useState<SubjectTemplatePayload[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [assuntoMode, setAssuntoMode] = useState<'select' | 'new'>('select');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [assuntoNovo, setAssuntoNovo] = useState('');
  const [relevancia, setRelevancia] = useState('Alta');

  const disciplinas = area ? (DISCIPLINAS_BY_AREA[area] ?? []) : [];

  // Auto-seleciona disciplina quando a área tem apenas 1 opção
  useEffect(() => {
    if (area && AUTO_DISCIPLINA[area]) {
      setDisciplina(AUTO_DISCIPLINA[area]);
    } else {
      setDisciplina('');
    }
    setTemplates([]);
    setSelectedTemplateId(null);
    setAssuntoMode('select');
    setAssuntoNovo('');
  }, [area]);

  // Busca templates quando a disciplina é selecionada
  useEffect(() => {
    if (!disciplina) return;
    setLoadingTemplates(true);
    setTemplates([]);
    setSelectedTemplateId(null);
    setAssuntoMode('select');
    api.subjectTemplates.list(disciplina)
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoadingTemplates(false));
  }, [disciplina]);

  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const handleAssuntoSelect = (value: string) => {
    if (value === NEW_VALUE) {
      setAssuntoMode('new');
      setSelectedTemplateId(null);
    } else {
      setAssuntoMode('select');
      setSelectedTemplateId(Number(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !disciplina) return;

    const assunto = assuntoMode === 'new' ? assuntoNovo : (selectedTemplate?.assunto ?? '');
    if (!assunto.trim()) return;

    const rel = assuntoMode === 'new' ? relevancia : (selectedTemplate?.relevancia ?? 'Alta');

    onAdd({
      area,
      modulo: disciplina,
      aulaPrincipal: assunto,
      relevancia: rel,
    });

    // Reset form
    setArea('');
    setDisciplina('');
    setTemplates([]);
    setSelectedTemplateId(null);
    setAssuntoMode('select');
    setAssuntoNovo('');
    setRelevancia('Alta');
  };

  const inputClass = "w-full bg-surface border border-border rounded-2xl px-6 py-4 text-navy text-sm focus:border-navy/20 focus:outline-none transition-colors";

  return (
    <div className="fixed inset-0 bg-navy/10 backdrop-blur-md z-[200] flex flex-col items-center justify-start p-6 overflow-y-auto">
      <div className="max-w-2xl w-full py-12">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-black text-navy uppercase tracking-tight">Registrar Estudo</h2>
          <button onClick={onClose} className="p-2 text-muted-light hover:text-navy transition-colors">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-border mb-12 shadow-2xl space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Área */}
            <div className="space-y-2">
              <label htmlFor="rg-area" className="text-[10px] font-black text-muted-light uppercase ml-2 tracking-widest">Área</label>
              <select
                id="rg-area"
                required
                value={area}
                onChange={e => setArea(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecionar...</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Disciplina */}
            <div className="space-y-2">
              <label htmlFor="rg-disciplina" className="text-[10px] font-black text-muted-light uppercase ml-2 tracking-widest">Disciplina</label>
              {AUTO_DISCIPLINA[area] ? (
                <input
                  id="rg-disciplina"
                  value={disciplina}
                  readOnly
                  className={`${inputClass} opacity-60 cursor-default`}
                />
              ) : (
                <select
                  id="rg-disciplina"
                  required
                  value={disciplina}
                  onChange={e => setDisciplina(e.target.value)}
                  disabled={!area}
                  className={`${inputClass} disabled:opacity-40`}
                >
                  <option value="">Selecionar...</option>
                  {disciplinas.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Assunto */}
            <div className="space-y-2">
              <label htmlFor="rg-assunto" className="text-[10px] font-black text-muted-light uppercase ml-2 tracking-widest">Assunto</label>
              {assuntoMode === 'select' ? (
                <select
                  id="rg-assunto"
                  required
                  value={selectedTemplateId ?? ''}
                  onChange={e => handleAssuntoSelect(e.target.value)}
                  disabled={!disciplina}
                  className={`${inputClass} disabled:opacity-40`}
                >
                  <option value="">{loadingTemplates ? 'Carregando...' : 'Selecionar...'}</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.assunto}</option>
                  ))}
                  <option value={NEW_VALUE}>+ Novo assunto</option>
                </select>
              ) : (
                <div className="space-y-1">
                  <input
                    required
                    autoFocus
                    value={assuntoNovo}
                    onChange={e => setAssuntoNovo(e.target.value)}
                    className={inputClass}
                    placeholder="Ex: Funções Trigonométricas"
                  />
                  <button
                    type="button"
                    onClick={() => { setAssuntoMode('select'); setAssuntoNovo(''); }}
                    className="text-[10px] text-navy/50 hover:text-navy ml-2 transition-colors"
                  >
                    ← Selecionar existente
                  </button>
                </div>
              )}
            </div>

            {/* Relevância */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-light uppercase ml-2 tracking-widest">Relevância</label>
              {assuntoMode === 'select' && selectedTemplate ? (
                <input
                  value={selectedTemplate.relevancia}
                  readOnly
                  className={`${inputClass} opacity-60 cursor-default`}
                />
              ) : (
                <select
                  value={relevancia}
                  onChange={e => setRelevancia(e.target.value)}
                  disabled={assuntoMode === 'select' && !selectedTemplate}
                  className={`${inputClass} disabled:opacity-40`}
                >
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              )}
            </div>
          </div>

          <button type="submit" className="w-full bg-navy text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-navy-light transition-all active:scale-95 shadow-lg">
            REGISTRAR ESTUDO
          </button>
        </form>

        <div className="space-y-3">
          <p className="text-muted-light text-[10px] font-black uppercase tracking-widest mb-6 ml-2">Estudos Registrados ({subjects.length})</p>
          {subjects.map(s => (
            <div key={s.id} className="bg-white border border-border p-5 rounded-2xl flex items-center justify-between group hover:border-navy/20 transition-colors shadow-sm">
              <div>
                <p className="text-navy font-bold text-sm mb-0.5">{s.aulaPrincipal}</p>
                <p className="text-muted-light text-[9px] font-black uppercase tracking-widest">{s.area} • {s.modulo}</p>
              </div>
              <button onClick={() => onRemove(s.id)} className="text-muted-light hover:text-red-500 p-2 transition-colors">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
