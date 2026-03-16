import type { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenGerenciar: () => void;
  onLogout: () => void;
}

export function Header({ activeView, onViewChange, onOpenGerenciar, onLogout }: HeaderProps) {
  const navItems: { id: ActiveView; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'cronograma', label: 'Cronograma' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'espiao', label: 'Espião' },
  ];

  return (
    <header className="bg-surface border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-12">
        <span className="text-xl font-black text-white tracking-tighter italic">EBBIN</span>
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                activeView === item.id 
                ? 'text-white border-b-2 border-white pb-1' 
                : 'text-white/30 hover:text-white pb-1 border-b-2 border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenGerenciar}
          className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black py-2.5 px-6 rounded-full transition-all border border-white/10 uppercase tracking-widest"
        >
          GERENCIAR
        </button>
        <button
          onClick={onLogout}
          className="text-white/20 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
