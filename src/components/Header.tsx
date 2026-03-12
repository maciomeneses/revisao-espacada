import { Home, BookOpen, Calendar, Eye, Settings, LogOut } from 'lucide-react';
import type { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenGerenciar: () => void;
  onLogout: () => void;
}

const TABS: { view: ActiveView; label: string; Icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Início', Icon: Home },
  { view: 'cronograma', label: 'Cronograma', Icon: BookOpen },
  { view: 'agenda', label: 'Agenda', Icon: Calendar },
  { view: 'espiao', label: 'Espião Estratégico', Icon: Eye },
];

export function Header({ activeView, onViewChange, onOpenGerenciar, onLogout }: HeaderProps) {
  return (
    <header className="bg-[#0f0f0f] border-b border-[#2a2a2a] sticky top-0 z-30">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4 md:gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}ebbin-logo.png`}
            alt="Ebbin"
            className="h-8 w-auto"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-xl font-bold text-white tracking-tight hidden sm:block">Ebbin</span>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(({ view, label, Icon }) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`tab-btn ${activeView === view ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              <Icon size={16} />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Gerenciar button */}
          <button
            onClick={onOpenGerenciar}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-[#333] bg-[#1a1a1a] text-gray-400 hover:text-white hover:border-[#555] transition-colors"
            title="Gerenciar conteúdo"
          >
            <Settings size={15} />
            <span className="whitespace-nowrap hidden md:inline">Gerenciar</span>
          </button>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-red-900/30 bg-red-900/10 text-red-400 hover:text-red-300 hover:bg-red-900/20 hover:border-red-900/50 transition-colors"
            title="Sair"
          >
            <LogOut size={15} />
            <span className="whitespace-nowrap hidden md:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
