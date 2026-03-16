import { useState } from 'react';
import type { Subject } from '../types';

interface GerenciarConteudoProps {
  subjects: Subject[];
  onAdd: (subject: Partial<Subject>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function GerenciarConteudo({ subjects, onAdd, onRemove, onClose }: GerenciarConteudoProps) {
  const [formData, setFormData] = useState({
    modulo: '',
    area: '',
    aulaPrincipal: '',
    relevancia: 'Alta'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ modulo: '', area: '', aulaPrincipal: '', relevancia: 'Alta' });
  };

  return (
    <div className="fixed inset-0 bg-navy/10 backdrop-blur-md z-[200] flex flex-col items-center justify-start p-6 overflow-y-auto">
      <div className="max-w-2xl w-full py-12">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-black text-navy uppercase tracking-tight">Gerenciar Temas</h2>
          <button onClick={onClose} className="p-2 text-muted-light hover:text-navy transition-colors">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-border mb-12 shadow-2xl space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-light uppercase ml-2 tracking-widest">Módulo</label>
              <input required value={formData.modulo} onChange={e => setFormData({...formData, modulo: e.target.value})} className="w-full bg-surface border border-border rounded-2xl px-6 py-4 text-navy text-sm focus:border-navy/20 focus:outline-none transition-colors" placeholder="Ex: Matemática" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-light uppercase ml-2 tracking-widest">Área</label>
              <input required value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full bg-surface border border-border rounded-2xl px-6 py-4 text-navy text-sm focus:border-navy/20 focus:outline-none transition-colors" placeholder="Ex: Álgebra" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-light uppercase ml-2 tracking-widest">Aula Principal</label>
            <input required value={formData.aulaPrincipal} onChange={e => setFormData({...formData, aulaPrincipal: e.target.value})} className="w-full bg-surface border border-border rounded-2xl px-6 py-4 text-navy text-sm focus:border-navy/20 focus:outline-none transition-colors" placeholder="Ex: Funções de Primeiro Grau" />
          </div>
          <button type="submit" className="w-full bg-navy text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-navy-light transition-all active:scale-95 shadow-lg">
            ADICIONAR AO CRONOGRAMA
          </button>
        </form>

        <div className="space-y-3">
          <p className="text-muted-light text-[10px] font-black uppercase tracking-widest mb-6 ml-2">Lista de Temas Atuais ({subjects.length})</p>
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
