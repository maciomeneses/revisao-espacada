import { useState } from 'react';
import type { RoutineSlot, StudentRoutine } from '../types';

function storageKey(email: string | null): string {
  return `ebbing_routine_v1_${email ?? '_guest'}`;
}

function loadRoutine(email: string | null): StudentRoutine {
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (raw) return JSON.parse(raw) as StudentRoutine;
  } catch {
    // ignore corrupt data
  }
  return [];
}

function saveRoutine(email: string | null, routine: StudentRoutine): void {
  localStorage.setItem(storageKey(email), JSON.stringify(routine));
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useRoutine(email: string | null) {
  const [routine, setRoutine] = useState<StudentRoutine>(() => loadRoutine(email));

  function addSlot(slot: Omit<RoutineSlot, 'id'>): void {
    const next = [...routine, { ...slot, id: generateId() }];
    saveRoutine(email, next);
    setRoutine(next);
  }

  function updateSlot(id: string, patch: Partial<Omit<RoutineSlot, 'id'>>): void {
    const next = routine.map((s) => (s.id === id ? { ...s, ...patch } : s));
    saveRoutine(email, next);
    setRoutine(next);
  }

  function removeSlot(id: string): void {
    const next = routine.filter((s) => s.id !== id);
    saveRoutine(email, next);
    setRoutine(next);
  }

  return { routine, addSlot, updateSlot, removeSlot };
}
