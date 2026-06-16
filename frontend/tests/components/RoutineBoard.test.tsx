import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

function getTitleInput(): HTMLInputElement {
  return screen.getByPlaceholderText(/Matemática, Corrida/) as HTMLInputElement;
}

function getTimeInputs(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll('input[type="time"]')) as HTMLInputElement[];
}

function getAreaSelect(): HTMLSelectElement | null {
  return document.querySelector('select') as HTMLSelectElement | null;
}
import { RoutineBoard } from '../../src/components/RoutineBoard';
import type { RoutineSlot, StudentRoutine } from '../../src/types';

function makeSlot(overrides: Partial<RoutineSlot> = {}): RoutineSlot {
  return {
    id: 'slot-1',
    dayOfWeek: 1,
    title: 'Matemática',
    startTime: '08:00',
    endTime: '10:00',
    type: 'study',
    area: 'Álgebra',
    ...overrides,
  };
}

interface RenderOpts {
  routine?: StudentRoutine;
  availableAreas?: string[];
  allowedDays?: Set<number>;
}

function setup(opts: RenderOpts = {}) {
  const onAdd = vi.fn();
  const onUpdate = vi.fn();
  const onRemove = vi.fn();
  const onToggleDay = vi.fn();
  const utils = render(
    <RoutineBoard
      routine={opts.routine ?? []}
      availableAreas={opts.availableAreas ?? ['Álgebra', 'Geometria']}
      allowedDays={opts.allowedDays ?? new Set([0, 1, 2, 3, 4, 5, 6])}
      onAdd={onAdd}
      onUpdate={onUpdate}
      onRemove={onRemove}
      onToggleDay={onToggleDay}
    />,
  );
  return { ...utils, onAdd, onUpdate, onRemove, onToggleDay };
}

describe('RoutineBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza título e 7 colunas de dias', () => {
    setup();
    expect(screen.getByText('Rotina Semanal')).toBeInTheDocument();
    ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    // botão "Adicionar slot em <dia>" para cada dia
    expect(screen.getAllByRole('button', { name: /Adicionar slot em/ })).toHaveLength(7);
  });

  it('renderiza slots no dia correto com horário e área', () => {
    const routine: StudentRoutine = [
      makeSlot({ id: 'a', dayOfWeek: 1, title: 'Matemática', area: 'Álgebra' }),
      makeSlot({
        id: 'b',
        dayOfWeek: 6,
        title: 'Corrida',
        type: 'other',
        area: undefined,
        startTime: '07:00',
        endTime: undefined,
      }),
    ];
    setup({ routine });
    expect(screen.getByText('Matemática')).toBeInTheDocument();
    expect(screen.getByText('Álgebra')).toBeInTheDocument();
    expect(screen.getByText('08:00–10:00')).toBeInTheDocument();
    expect(screen.getByText('Corrida')).toBeInTheDocument();
    expect(screen.getByText('07:00')).toBeInTheDocument();
  });

  it('renderiza 7 toggles de allowedDays com aria-pressed correto', () => {
    setup({ allowedDays: new Set([1, 3, 5]) });
    const toggles = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    expect(toggles).toHaveLength(7);
    // ordem: dom(0), seg(1), ter(2), qua(3), qui(4), sex(5), sáb(6)
    const pressed = toggles.map((t) => t.getAttribute('aria-pressed'));
    expect(pressed).toEqual(['false', 'true', 'false', 'true', 'false', 'true', 'false']);
  });

  it('clicar em toggle dispara onToggleDay com o day correto', () => {
    const { onToggleDay } = setup({ allowedDays: new Set([0, 1, 2, 3, 4, 5, 6]) });
    const toggles = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    fireEvent.click(toggles[2]); // terça (day=2)
    expect(onToggleDay).toHaveBeenCalledWith(2);
  });

  it('quando só sobra 1 dia ativo, o toggle desse dia fica disabled', () => {
    setup({ allowedDays: new Set([3]) });
    const toggles = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    const activeToggle = toggles[3]; // day 3
    expect(activeToggle).toBeDisabled();
    // outros não estão disabled
    toggles.filter((_, i) => i !== 3).forEach((t) => expect(t).not.toBeDisabled());
  });

  it('abre modal ao clicar no botão + de adicionar', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar slot em Seg' }));
    expect(screen.getByText('Novo slot')).toBeInTheDocument();
    expect(getTitleInput()).toHaveValue('');
  });

  it('botão Adicionar fica desabilitado quando título vazio e submit não chama onAdd', () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar slot em Seg' }));
    const submit = screen.getByRole('button', { name: 'Adicionar' });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('submete novo slot com payload correto', () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar slot em Qua' })); // dayOfWeek=3
    fireEvent.change(getTitleInput(), { target: { value: 'Física' } });
    const times = getTimeInputs();
    fireEvent.change(times[0], { target: { value: '09:00' } });
    fireEvent.change(times[1], { target: { value: '11:00' } });
    fireEvent.change(getAreaSelect()!, { target: { value: 'Álgebra' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(onAdd).toHaveBeenCalledWith({
      title: 'Física',
      type: 'study',
      startTime: '09:00',
      endTime: '11:00',
      area: 'Álgebra',
      dayOfWeek: 3,
    });
  });

  it('ao escolher tipo "Outro", esconde o campo de área e não envia area', () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar slot em Seg' }));
    fireEvent.change(getTitleInput(), { target: { value: 'Yoga' } });
    fireEvent.click(screen.getByRole('button', { name: 'Outro' }));
    expect(getAreaSelect()).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Yoga', type: 'other', dayOfWeek: 1 }),
    );
    expect(onAdd.mock.calls[0][0]).not.toHaveProperty('area');
  });

  it('botão Cancelar fecha o modal sem chamar callback', () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar slot em Seg' }));
    expect(screen.getByText('Novo slot')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Novo slot')).not.toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('botão X do header também fecha o modal', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar slot em Seg' }));
    expect(screen.getByText('Novo slot')).toBeInTheDocument();
    // o botão X do header é o primeiro botão sem aria-label visível dentro do modal
    const modalHeading = screen.getByText('Novo slot');
    const modal = modalHeading.closest('div')!.parentElement!.parentElement!;
    const closeBtn = within(modal).getAllByRole('button')[0];
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Novo slot')).not.toBeInTheDocument();
  });

  it('abre modal de edição pré-preenchido ao clicar em editar', () => {
    const routine: StudentRoutine = [makeSlot({ id: 's1', title: 'Matemática' })];
    setup({ routine });
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByText('Editar slot')).toBeInTheDocument();
    expect(getTitleInput()).toHaveValue('Matemática');
    const times = getTimeInputs();
    expect(times[0]).toHaveValue('08:00');
    expect(times[1]).toHaveValue('10:00');
    expect(getAreaSelect()).toHaveValue('Álgebra');
  });

  it('salva edição chamando onUpdate com id e patch', () => {
    const routine: StudentRoutine = [makeSlot({ id: 's1' })];
    const { onUpdate } = setup({ routine });
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(getTitleInput(), { target: { value: 'Mat. avançada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onUpdate).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ title: 'Mat. avançada', dayOfWeek: 1, type: 'study' }),
    );
  });

  it('clicar em remover dispara onRemove(id)', () => {
    const routine: StudentRoutine = [makeSlot({ id: 'slot-x' })];
    const { onRemove } = setup({ routine });
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));
    expect(onRemove).toHaveBeenCalledWith('slot-x');
  });

  it('quando availableAreas está vazio, modal não mostra select de área', () => {
    setup({ availableAreas: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar slot em Seg' }));
    expect(getAreaSelect()).toBeNull();
  });

  it('lida com slot sem startTime e sem area (type other)', () => {
    const routine: StudentRoutine = [
      makeSlot({
        id: 's1',
        type: 'other',
        area: undefined,
        startTime: undefined,
        endTime: undefined,
        title: 'Descanso',
      }),
    ];
    setup({ routine });
    expect(screen.getByText('Descanso')).toBeInTheDocument();
    // sem startTime nem area visíveis
    expect(screen.queryByText('08:00–10:00')).not.toBeInTheDocument();
  });

  it('títulos só com espaços não submetem (trim)', () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar slot em Seg' }));
    fireEvent.change(getTitleInput(), { target: { value: '   ' } });
    const submit = screen.getByRole('button', { name: 'Adicionar' });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(onAdd).not.toHaveBeenCalled();
  });
});
