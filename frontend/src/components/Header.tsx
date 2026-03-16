import { Home, BookOpen, Calendar, Eye, Settings, LogOut } from 'lucide-react';
import type { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenGerenciar: () => void;
  onLogout: () => void;
}

const TABS: { view: ActiveView; label: string; Icon: React.ElementType }[] = [
  { view: 'dashboard',  label: 'Início',              Icon: Home      },
  { view: 'cronograma', label: 'Cronograma',           Icon: BookOpen  },
  { view: 'agenda',     label: 'Agenda',               Icon: Calendar  },
  { view: 'espiao',     label: 'Espião Estratégico',   Icon: Eye       },
];

export function Header({ activeView, onViewChange, onOpenGerenciar, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-30 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4 md:gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}ebbin-logo.png`}
            alt="Ebbin"
            className="h-8 w-auto"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-xl font-bold text-navy tracking-tight hidden sm:block">Ebbin</span>
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
          <button
            onClick={onOpenGerenciar}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm border border-[#e2e8f0] bg-white text-muted hover:text-navy hover:border-[#cbd5e1] transition-colors shadow-sm"
            title="Gerenciar conteúdo"
          >
            <Settings size={15} />
            <span className="whitespace-nowrap hidden md:inline">Gerenciar</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300 transition-colors"
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
