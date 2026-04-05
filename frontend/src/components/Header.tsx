import { LayoutDashboard, Calendar, TrendingUp, Shield } from 'lucide-react';
import type { ActiveView, Role } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  userRole?: Role;
  onViewChange: (view: ActiveView) => void;
  onOpenGerenciar: () => void;
  onLogout: () => void;
}

const NAV_ICONS: Record<string, React.ElementType> = {
  dashboard:  LayoutDashboard,
  cronograma: Calendar,
  espiao:     TrendingUp,
  admin:      Shield,
};

export function Header({ activeView, userRole, onViewChange, onOpenGerenciar, onLogout }: HeaderProps) {
  const navItems: { id: ActiveView; label: string; adminOnly?: boolean }[] = [
    { id: 'dashboard',  label: 'Dashboard' },
    { id: 'cronograma', label: 'Cronograma' },
    { id: 'espiao',     label: 'Estatísticas' },
    { id: 'admin',      label: 'Admin', adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || userRole === 'ADMIN');

  return (
    <>
      {/* ── Top header ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-border px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-12">
          <img src="/ebbing-logo.png?v=1" alt="Logo Ebbing" className="h-8 object-contain" />

          {/* Desktop nav — hidden on mobile */}
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

        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onOpenGerenciar}
            className="bg-navy/5 hover:bg-navy/10 text-navy text-[10px] font-black py-2 md:py-2.5 px-4 md:px-6 rounded-full transition-all border border-navy/10 uppercase tracking-widest"
          >
            Gerenciar
          </button>
          <button
            onClick={onLogout}
            className="text-muted hover:text-navy text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* ── Mobile bottom tab bar — hidden on md+ ─────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border">
        <div className="flex items-stretch justify-around">
          {visibleItems.map((item) => {
            const Icon = NAV_ICONS[item.id];
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-3 transition-all ${
                  active ? 'text-navy' : 'text-muted-light'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-yellow rounded-full" />
                )}
                <Icon
                  className="w-5 h-5"
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span className="text-[9px] font-black uppercase tracking-wider leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* Safe-area spacer for iOS home indicator */}
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>
    </>
  );
}
