import { useCallback, useEffect, useState } from 'react';
import type { Area, Discipline } from '../types';
import { api } from '../services/api';

/**
 * CRUD compartilhado de áreas e disciplinas do usuário. Segue o padrão da
 * Fase 1: a API é a fonte de verdade; o estado local é sincronizado via fetch,
 * atualizações otimistas revertem em caso de falha e erros são expostos
 * para a UI tratar.
 */
export function useCatalog() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('ebbing_session')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [areaList, disciplineList] = await Promise.all([
        api.areas.list(),
        api.disciplines.list(),
      ]);
      setAreas([...areaList].sort((a, b) => a.name.localeCompare(b.name)));
      setDisciplines([...disciplineList].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('useCatalog.refresh failed:', err);
      setError('Não foi possível carregar o catálogo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createArea = useCallback(async (name: string): Promise<Area | null> => {
    try {
      const created = await api.areas.create(name);
      setAreas((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    } catch (err) {
      console.error('createArea failed:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível criar a área.');
      return null;
    }
  }, []);

  const renameArea = useCallback(async (id: number, name: string): Promise<boolean> => {
    const previous = areas;
    setAreas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name } : a))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    // Disciplines carregam areaName — atualiza para consistência na UI.
    setDisciplines((prev) =>
      prev.map((d) => (d.areaId === id ? { ...d, areaName: name } : d))
    );
    try {
      await api.areas.update(id, name);
      return true;
    } catch (err) {
      console.error('renameArea failed:', err);
      setAreas(previous);
      // Reverte areaName nas disciplines afetadas recarregando do servidor.
      refresh();
      setError(err instanceof Error ? err.message : 'Não foi possível renomear a área.');
      return false;
    }
  }, [areas, refresh]);

  const deleteArea = useCallback(async (id: number): Promise<boolean> => {
    const previousAreas = areas;
    const previousDisciplines = disciplines;
    setAreas((prev) => prev.filter((a) => a.id !== id));
    setDisciplines((prev) => prev.filter((d) => d.areaId !== id));
    try {
      await api.areas.delete(id);
      return true;
    } catch (err) {
      console.error('deleteArea failed:', err);
      setAreas(previousAreas);
      setDisciplines(previousDisciplines);
      setError(err instanceof Error ? err.message : 'Não foi possível excluir a área.');
      return false;
    }
  }, [areas, disciplines]);

  const createDiscipline = useCallback(async (areaId: number, name: string): Promise<Discipline | null> => {
    try {
      const created = await api.disciplines.create(areaId, name);
      setDisciplines((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    } catch (err) {
      console.error('createDiscipline failed:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível criar a disciplina.');
      return null;
    }
  }, []);

  const renameDiscipline = useCallback(async (id: number, name: string): Promise<boolean> => {
    const previous = disciplines;
    setDisciplines((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name } : d))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    try {
      await api.disciplines.update(id, name);
      return true;
    } catch (err) {
      console.error('renameDiscipline failed:', err);
      setDisciplines(previous);
      setError(err instanceof Error ? err.message : 'Não foi possível renomear a disciplina.');
      return false;
    }
  }, [disciplines]);

  const deleteDiscipline = useCallback(async (id: number): Promise<boolean> => {
    const previous = disciplines;
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
    try {
      await api.disciplines.delete(id);
      return true;
    } catch (err) {
      console.error('deleteDiscipline failed:', err);
      setDisciplines(previous);
      setError(err instanceof Error ? err.message : 'Não foi possível excluir a disciplina.');
      return false;
    }
  }, [disciplines]);

  return {
    areas,
    disciplines,
    loading,
    error,
    clearError,
    refresh,
    createArea,
    renameArea,
    deleteArea,
    createDiscipline,
    renameDiscipline,
    deleteDiscipline,
  };
}
