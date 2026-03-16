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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex flex-col items-center justify-start p-6 overflow-y-auto">
      <div className="max-w-2xl w-full py-12">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-black text-white uppercase tracking-tight">Gerenciar Temas</h2>
          <button onClick={onClose} className="p-4 text-white/50 hover:text-white transition-colors">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 mb-12 shadow-2xl space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Módulo</label>
              <input required value={formData.modulo} onChange={e => setFormData({...formData, modulo: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-white/20 transition-colors" placeholder="Ex: Matemática" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Área</label>
              <input required value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-white/20 transition-colors" placeholder="Ex: Álgebra" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Aula Principal</label>
            <input required value={formData.aulaPrincipal} onChange={e => setFormData({...formData, aulaPrincipal: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-white/20 transition-colors" placeholder="Ex: Funções de Primeiro Grau" />
          </div>
          <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-xl">
            ADICIONAR AO CRONOGRAMA
          </button>
        </form>

        <div className="space-y-4">
          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-6">Lista de Temas Atuais ({subjects.length})</p>
          {subjects.map(s => (
            <div key={s.id} className="bg-white/5 border border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-colors">
              <div>
                <p className="text-white font-bold text-sm">{s.aulaPrincipal}</p>
                <p className="text-white/30 text-[10px] font-black uppercase tracking-tighter">{s.area} • {s.modulo}</p>
              </div>
              <button onClick={() => onRemove(s.id)} className="text-white/20 hover:text-red-500 p-2 transition-colors">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
