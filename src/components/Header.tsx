import { BookOpen, Calendar, Eye } from 'lucide-react';
import type { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

const TABS: { view: ActiveView; label: string; Icon: React.ElementType }[] = [
  { view: 'cronograma', label: 'Cronograma', Icon: BookOpen },
  { view: 'agenda', label: 'Agenda', Icon: Calendar },
  { view: 'espiao', label: 'Espião Estratégico', Icon: Eye },
];

export function Header({ activeView, onViewChange }: HeaderProps) {
  return (
    <header className="bg-[#0f0f0f] border-b border-[#2a2a2a] sticky top-0 z-30">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold text-white tracking-tight">RevisaENEM</span>
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
      </div>
    </header>
  );
}
