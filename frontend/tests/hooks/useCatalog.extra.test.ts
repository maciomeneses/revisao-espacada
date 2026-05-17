import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCatalog } from '../../src/hooks/useCatalog';
import { api } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  api: {
    areas: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    disciplines: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

const mockApi = api as any;

describe('useCatalog (cobertura extra)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('ebbing_session', JSON.stringify({ token: 't', email: 'u@e.com' }));
    mockApi.areas.list.mockResolvedValue([{ id: 1, name: 'A1' }]);
    mockApi.disciplines.list.mockResolvedValue([
      { id: 10, areaId: 1, areaName: 'A1', name: 'D1' },
    ]);
  });

  it('refresh expõe erro genérico quando lista falha', async () => {
    mockApi.areas.list.mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatch(/catálogo/i);
  });

  it('renameArea reverte estado em falha (rollback)', async () => {
    mockApi.areas.update.mockRejectedValueOnce(new Error('rede'));
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.renameArea(1, 'Novo Nome');
    });

    // após rollback, deve retornar nome original
    await waitFor(() => {
      expect(result.current.areas.find((a) => a.id === 1)?.name).toBe('A1');
    });
    expect(result.current.error).toBeTruthy();
  });

  it('createDiscipline expõe erro quando API rejeita', async () => {
    mockApi.disciplines.create.mockRejectedValueOnce(new Error('Já existe'));
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createDiscipline(1, 'D2');
    });
    expect(result.current.error).toMatch(/existe/i);
  });

  it('renameDiscipline reverte em falha', async () => {
    mockApi.disciplines.update.mockRejectedValueOnce(new Error('rede'));
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.renameDiscipline(10, 'X');
    });

    expect(result.current.disciplines.find((d) => d.id === 10)?.name).toBe('D1');
    expect(result.current.error).toBeTruthy();
  });

  it('deleteDiscipline sucesso remove do estado', async () => {
    mockApi.disciplines.delete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteDiscipline(10);
    });
    expect(result.current.disciplines.find((d) => d.id === 10)).toBeUndefined();
  });

  it('createArea fallback de mensagem quando erro não é Error', async () => {
    mockApi.areas.create.mockRejectedValueOnce('string-error');
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.createArea('X');
    });
    expect(result.current.error).toMatch(/criar a área/i);
  });

  it('deleteArea fallback de mensagem quando erro não é Error', async () => {
    mockApi.areas.delete.mockRejectedValueOnce('boom');
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deleteArea(1);
    });
    expect(result.current.error).toMatch(/excluir a área/i);
  });

  it('createDiscipline fallback de mensagem quando erro não é Error', async () => {
    mockApi.disciplines.create.mockRejectedValueOnce('boom');
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.createDiscipline(1, 'D');
    });
    expect(result.current.error).toMatch(/criar a disciplina/i);
  });

  it('renameDiscipline fallback de mensagem quando erro não é Error', async () => {
    mockApi.disciplines.update.mockRejectedValueOnce('boom');
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.renameDiscipline(10, 'X');
    });
    expect(result.current.error).toMatch(/renomear a disciplina/i);
  });

  it('deleteDiscipline fallback de mensagem quando erro não é Error', async () => {
    mockApi.disciplines.delete.mockRejectedValueOnce('boom');
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deleteDiscipline(10);
    });
    expect(result.current.error).toMatch(/excluir a disciplina/i);
  });

  it('renameArea fallback de mensagem quando erro não é Error', async () => {
    mockApi.areas.update.mockRejectedValueOnce('boom');
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.renameArea(1, 'X');
    });
    expect(result.current.error).toMatch(/renomear a área/i);
  });
});
