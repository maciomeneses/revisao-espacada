import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCatalog } from '../../src/hooks/useCatalog';
import { api } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  api: {
    areas: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    disciplines: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockApi = api as any;

describe('useCatalog', () => {
  const initialAreas = [
    { id: 1, name: 'Ciências da Natureza' },
    { id: 2, name: 'Matemática e suas Tecnologias' },
  ];
  const initialDisciplines = [
    { id: 10, areaId: 1, areaName: 'Ciências da Natureza', name: 'Biologia' },
    { id: 11, areaId: 2, areaName: 'Matemática e suas Tecnologias', name: 'Matemática' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    mockApi.areas.list.mockResolvedValue(initialAreas);
    mockApi.disciplines.list.mockResolvedValue(initialDisciplines);
  });

  it('carrega áreas e disciplinas ao montar', async () => {
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.areas).toHaveLength(2);
    expect(result.current.disciplines).toHaveLength(2);
  });

  it('não carrega sem sessão ativa', async () => {
    localStorage.clear();
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApi.areas.list).not.toHaveBeenCalled();
  });

  it('createArea adiciona a nova área ao estado', async () => {
    mockApi.areas.create.mockResolvedValue({ id: 99, name: 'Redação' });
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createArea('Redação');
    });

    expect(result.current.areas.find((a) => a.name === 'Redação')).toBeDefined();
  });

  it('createArea expõe erro e não altera estado em falha', async () => {
    mockApi.areas.create.mockRejectedValueOnce(new Error('Área já existe'));
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createArea('Ciências da Natureza');
    });

    expect(result.current.error).toMatch(/já existe/i);
    expect(result.current.areas).toHaveLength(2);
  });

  it('deleteArea remove a área e suas disciplines localmente (cascade otimista)', async () => {
    mockApi.areas.delete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteArea(1);
    });

    expect(result.current.areas.find((a) => a.id === 1)).toBeUndefined();
    expect(result.current.disciplines.find((d) => d.areaId === 1)).toBeUndefined();
  });

  it('deleteArea reverte estado em falha', async () => {
    mockApi.areas.delete.mockRejectedValueOnce(new Error('rede'));
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteArea(1);
    });

    // Estado rollback
    expect(result.current.areas.find((a) => a.id === 1)).toBeDefined();
    expect(result.current.error).toBeTruthy();
  });

  it('renameArea atualiza o nome e o areaName das disciplines vinculadas', async () => {
    mockApi.areas.update.mockResolvedValue({ id: 1, name: 'Natureza' });
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.renameArea(1, 'Natureza');
    });

    expect(result.current.areas.find((a) => a.id === 1)?.name).toBe('Natureza');
    expect(result.current.disciplines.find((d) => d.areaId === 1)?.areaName).toBe('Natureza');
  });

  it('createDiscipline adiciona a disciplina ao estado', async () => {
    mockApi.disciplines.create.mockResolvedValue({
      id: 50, areaId: 1, areaName: 'Ciências da Natureza', name: 'Química',
    });
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createDiscipline(1, 'Química');
    });

    expect(result.current.disciplines.find((d) => d.name === 'Química')).toBeDefined();
  });

  it('deleteDiscipline remove e reverte em falha', async () => {
    mockApi.disciplines.delete.mockRejectedValueOnce(new Error('rede'));
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteDiscipline(10);
    });

    expect(result.current.disciplines.find((d) => d.id === 10)).toBeDefined();
    expect(result.current.error).toBeTruthy();
  });

  it('clearError zera a mensagem de erro', async () => {
    mockApi.areas.create.mockRejectedValueOnce(new Error('x'));
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createArea('Redação');
    });
    expect(result.current.error).toBeTruthy();

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
