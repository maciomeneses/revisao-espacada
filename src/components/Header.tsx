import { BookOpen, Calendar, Eye, Settings } from 'lucide-react';
import type { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenGerenciar: () => void;
}

const TABS: { view: ActiveView; label: string; Icon: React.ElementType }[] = [
  { view: 'cronograma', label: 'Cronograma', Icon: BookOpen },
  { view: 'agenda', label: 'Agenda', Icon: Calendar },
  { view: 'espiao', label: 'Espião Estratégico', Icon: Eye },
];

export function Header({ activeView, onViewChange, onOpenGerenciar }: HeaderProps) {
  return (
    <header className="bg-[#0f0f0f] border-b border-[#2a2a2a] sticky top-0 z-30">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}ebbin-logo.png`}
            alt="Ebbin"
            className="h-8 w-auto"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-xl font-bold text-white tracking-tight">Ebbin</span>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto">
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

        {/* Gerenciar button */}
        <button
          onClick={onOpenGerenciar}
          className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-[#333] bg-[#1a1a1a] text-gray-400 hover:text-white hover:border-[#555] transition-colors shrink-0"
          title="Gerenciar conteúdo"
        >
          <Settings size={15} />
          <span className="whitespace-nowrap">Gerenciar</span>
        </button>
      </div>
    </header>
  );
}
