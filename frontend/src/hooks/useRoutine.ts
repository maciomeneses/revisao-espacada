import { useEffect, useRef, useState } from 'react';
import type { RoutineSlot, StudentRoutine } from '../types';
import { api } from '../services/api';
import { routineStorageKey } from '../services/storage';

/** Chave v1 (legada, somente leitura para migração one-shot). */
function legacyStorageKey(email: string | null | undefined): string {
  return `ebbing_routine_v1_${email ?? '_guest'}`;
}

function loadRoutine(email: string | null | undefined): StudentRoutine {
  try {
    const raw = localStorage.getItem(routineStorageKey(email));
    if (raw) return JSON.parse(raw) as StudentRoutine;
  } catch {
    // ignore corrupt data
  }
  return [];
}

function loadLegacyRoutine(email: string | null | undefined): StudentRoutine | null {
  try {
    const raw = localStorage.getItem(legacyStorageKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentRoutine;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveRoutine(email: string | null | undefined, routine: StudentRoutine): void {
  localStorage.setItem(routineStorageKey(email), JSON.stringify(routine));
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Hook central da rotina semanal.
 *
 * Contrato (mesmo padrão de `useSubjects`):
 * - Backend (`api.routine.list/save`) é a fonte de verdade quando há sessão.
 * - localStorage `ebbing_routine_v2_<email>` é apenas cache otimista —
 *   hidratação rápida e rollback de mutações falhas.
 * - Re-hidrata e re-busca a rotina sempre que `email` muda (login, logout,
 *   troca de usuário).
 * - Migração one-shot v1 → v2 + backend: se houver dados na chave legada
 *   `ebbing_routine_v1_<email>` mas o backend devolver lista vazia, sobe
 *   a v1 via PUT e grava no cache v2.
 */
export function useRoutine(email: string | null) {
  const [routine, setRoutine] = useState<StudentRoutine>(() => loadRoutine(email));
  const routineRef = useRef<StudentRoutine>(routine);

  useEffect(() => {
    routineRef.current = routine;
  }, [routine]);

  // Re-hidrata cache local + busca do backend ao trocar email.
  useEffect(() => {
    setRoutine(loadRoutine(email));

    if (!email) return;
    if (!localStorage.getItem('ebbing_session')) return;

    let cancelled = false;
    api.routine
      .list()
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data)) return;
        const apiRoutine = data as StudentRoutine;
        // Migração one-shot v1 -> v2 + backend.
        if (apiRoutine.length === 0) {
          const legacy = loadLegacyRoutine(email);
          if (legacy && legacy.length > 0) {
            saveRoutine(email, legacy);
            setRoutine(legacy);
            api.routine.save(legacy).catch((err) => console.error('routine v1->v2 migration failed:', err));
            return;
          }
        }
        setRoutine(apiRoutine);
        saveRoutine(email, apiRoutine);
      })
      .catch((err) => console.error('routine list failed:', err));

    return () => {
      cancelled = true;
    };
  }, [email]);

  /** Persiste no backend (fire-and-forget); rollback do state em falha. */
  function persist(next: StudentRoutine, previous: StudentRoutine): void {
    saveRoutine(email, next);
    setRoutine(next);
    if (!email) return;
    if (!localStorage.getItem('ebbing_session')) return;
    api.routine.save(next).catch((err) => {
      console.error('routine save failed:', err);
      saveRoutine(email, previous);
      setRoutine(previous);
    });
  }

  function addSlot(slot: Omit<RoutineSlot, 'id'>): void {
    const previous = routineRef.current;
    const next = [...previous, { ...slot, id: generateId() }];
    persist(next, previous);
  }

  function updateSlot(id: string, patch: Partial<Omit<RoutineSlot, 'id'>>): void {
    const previous = routineRef.current;
    const next = previous.map((s) => (s.id === id ? { ...s, ...patch } : s));
    persist(next, previous);
  }

  function removeSlot(id: string): void {
    const previous = routineRef.current;
    const next = previous.filter((s) => s.id !== id);
    persist(next, previous);
  }

  return { routine, addSlot, updateSlot, removeSlot };
}
