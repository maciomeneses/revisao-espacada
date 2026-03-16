import type { ActiveView, Role } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  userRole?: Role;
  onViewChange: (view: ActiveView) => void;
  onOpenGerenciar: () => void;
  onLogout: () => void;
}

export function Header({ activeView, userRole, onViewChange, onOpenGerenciar, onLogout }: HeaderProps) {
  const navItems: { id: ActiveView; label: string; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'cronograma', label: 'Cronograma' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'espiao', label: 'Espião' },
    { id: 'admin', label: 'Painel Admin', adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || userRole === 'ADMIN');

  return (
    <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-12">
        <span className="text-xl font-black text-navy tracking-tighter italic">EBBIN</span>
        <nav className="hidden md:flex items-center gap-8">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                activeView === item.id 
                ? 'text-navy border-b-2 border-yellow pb-1' 
                : 'text-muted hover:text-navy pb-1 border-b-2 border-transparent'
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
          className="bg-navy/5 hover:bg-navy/10 text-navy text-[10px] font-black py-2.5 px-6 rounded-full transition-all border border-navy/10 uppercase tracking-widest"
        >
          GERENCIAR
        </button>
        <button
          onClick={onLogout}
          className="text-muted hover:text-navy text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
