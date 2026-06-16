import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Header } from '../../src/components/Header';

describe('Header', () => {
  let onViewChange: ReturnType<typeof vi.fn>;
  let onOpenGerenciar: ReturnType<typeof vi.fn>;
  let onLogout: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onViewChange = vi.fn();
    onOpenGerenciar = vi.fn();
    onLogout = vi.fn();
  });

  function renderHeader(overrides: Partial<React.ComponentProps<typeof Header>> = {}) {
    return render(
      <Header
        activeView="dashboard"
        userRole="USER"
        onViewChange={onViewChange}
        onOpenGerenciar={onOpenGerenciar}
        onLogout={onLogout}
        {...overrides}
      />,
    );
  }

  it('renderiza o logo do Ebbing', () => {
    renderHeader();
    const logo = screen.getByAltText(/Logo Ebbing/i);
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', expect.stringContaining('ebbing-logo'));
  });

  it('renderiza os itens de navegação padrão para usuário comum (sem Admin)', () => {
    renderHeader({ userRole: 'USER' });
    // Cada label aparece duas vezes (desktop + mobile bottom bar)
    expect(screen.getAllByText('Início').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Estudos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Estatísticas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Provas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Categorias').length).toBeGreaterThan(0);
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('mostra o item Admin somente para ADMIN', () => {
    renderHeader({ userRole: 'ADMIN' });
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
  });

  it('não mostra Admin quando userRole é undefined', () => {
    renderHeader({ userRole: undefined });
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('destaca o item ativo (activeView=cronograma)', () => {
    renderHeader({ activeView: 'cronograma' });
    const buttons = screen.getAllByText('Estudos');
    // Desktop button deve ter border-yellow indicando ativo
    const desktopButton = buttons.find((el) => el.className.includes('border-yellow'));
    expect(desktopButton).toBeTruthy();
  });

  it('chama onViewChange ao clicar em item de navegação desktop', () => {
    renderHeader({ activeView: 'dashboard' });
    // Pega o primeiro botão "Estudos" (desktop nav vem antes)
    const buttons = screen.getAllByText('Estudos');
    fireEvent.click(buttons[0]);
    expect(onViewChange).toHaveBeenCalledWith('cronograma');
  });

  it('chama onViewChange para cada item da nav', () => {
    renderHeader({ userRole: 'ADMIN' });
    const provas = screen.getAllByText('Provas')[0];
    fireEvent.click(provas);
    expect(onViewChange).toHaveBeenCalledWith('provas');

    const admin = screen.getAllByText('Admin')[0];
    fireEvent.click(admin);
    expect(onViewChange).toHaveBeenCalledWith('admin');
  });

  it('chama onOpenGerenciar ao clicar em "Registrar estudo"', () => {
    renderHeader();
    fireEvent.click(screen.getByText(/Registrar estudo/i));
    expect(onOpenGerenciar).toHaveBeenCalledTimes(1);
  });

  it('chama onLogout ao clicar em "Sair"', () => {
    renderHeader();
    fireEvent.click(screen.getByText(/Sair/i));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('mobile bottom nav renderiza ícones para cada item visível', () => {
    const { container } = renderHeader({ userRole: 'ADMIN' });
    const mobileNav = container.querySelector('nav.fixed.bottom-0');
    expect(mobileNav).toBeTruthy();
    const mobileButtons = within(mobileNav as HTMLElement).getAllByRole('button');
    // 6 itens (5 padrões + Admin)
    expect(mobileButtons).toHaveLength(6);
  });

  it('clique no botão mobile dispara onViewChange', () => {
    const { container } = renderHeader();
    const mobileNav = container.querySelector('nav.fixed.bottom-0') as HTMLElement;
    const buttons = within(mobileNav).getAllByRole('button');
    fireEvent.click(buttons[2]); // espiao
    expect(onViewChange).toHaveBeenCalledWith('espiao');
  });
});
