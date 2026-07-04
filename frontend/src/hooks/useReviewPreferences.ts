import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

const ALL_DAYS: ReadonlyArray<number> = [0, 1, 2, 3, 4, 5, 6];

function storageKey(email: string | null | undefined): string {
  return `ebbing_prefs_v1_${email ?? '_guest'}`;
}

function maxStorageKey(email: string | null | undefined): string {
  return `ebbing_prefs_max_v1_${email ?? '_guest'}`;
}

function load(email: string | null | undefined): Set<number> {
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (raw) {
      const parsed = JSON.parse(raw) as number[];
      if (Array.isArray(parsed)) return new Set(parsed.filter((d) => d >= 0 && d <= 6));
    }
  } catch {
    // ignore corrupt data
  }
  return new Set(ALL_DAYS);
}

function save(email: string | null | undefined, days: Set<number>): void {
  localStorage.setItem(storageKey(email), JSON.stringify([...days].sort()));
}

function loadMax(email: string | null | undefined): number | null {
  try {
    const raw = localStorage.getItem(maxStorageKey(email));
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === 'number' && Number.isInteger(parsed) && parsed >= 1) return parsed;
    }
  } catch {
    // ignore corrupt data
  }
  return null;
}

function saveMax(email: string | null | undefined, max: number | null): void {
  if (max === null) {
    localStorage.removeItem(maxStorageKey(email));
  } else {
    localStorage.setItem(maxStorageKey(email), JSON.stringify(max));
  }
}

/**
 * Hook central das preferências de revisão.
 *
 * Contrato (mesmo padrão de `useSubjects` / `useRoutine`):
 * - Backend (`api.preferences.get/save`) é a fonte de verdade quando há sessão.
 * - localStorage `ebbing_prefs_v1_<email>` (dias) e `ebbing_prefs_max_v1_<email>`
 *   (limite diário) são apenas cache otimista.
 * - Re-hidrata e re-busca ao trocar `email`.
 * - `allowedDays` nunca pode ficar vazio: tentativas de setar `Set` vazio são
 *   rejeitadas no client (UI deve impedir, o backend também valida).
 * - `maxReviewsPerDay` é `null` (sem limite) ou inteiro ≥ 1. O PUT substitui o
 *   recurso completo, então todo save envia dias + limite juntos.
 */
export function useReviewPreferences(email: string | null) {
  const [allowedDays, setAllowedDaysState] = useState<Set<number>>(() => load(email));
  const [maxReviewsPerDay, setMaxState] = useState<number | null>(() => loadMax(email));
  const allowedDaysRef = useRef<Set<number>>(allowedDays);
  const maxRef = useRef<number | null>(maxReviewsPerDay);

  useEffect(() => {
    allowedDaysRef.current = allowedDays;
  }, [allowedDays]);

  useEffect(() => {
    maxRef.current = maxReviewsPerDay;
  }, [maxReviewsPerDay]);

  useEffect(() => {
    setAllowedDaysState(load(email));
    setMaxState(loadMax(email));

    if (!email) return;
    if (!localStorage.getItem('ebbing_session')) return;

    let cancelled = false;
    api.preferences
      .get()
      .then((data) => {
        if (cancelled) return;
        const next = new Set(data.allowedReviewDays);
        const nextMax = data.maxReviewsPerDay ?? null;
        setAllowedDaysState(next);
        setMaxState(nextMax);
        save(email, next);
        saveMax(email, nextMax);
      })
      .catch((err) => console.error('preferences get failed:', err));

    return () => {
      cancelled = true;
    };
  }, [email]);

  function persist(days: Set<number>, max: number | null, rollback: () => void): void {
    if (!email) return;
    if (!localStorage.getItem('ebbing_session')) return;
    api.preferences
      .save({ allowedReviewDays: [...days].sort(), maxReviewsPerDay: max })
      .catch((err) => {
        console.error('preferences save failed:', err);
        rollback();
      });
  }

  function setAllowedDays(next: Set<number>): void {
    if (next.size === 0) return;
    const previous = allowedDaysRef.current;
    save(email, next);
    setAllowedDaysState(next);
    persist(next, maxRef.current, () => {
      save(email, previous);
      setAllowedDaysState(previous);
    });
  }

  function toggleDay(day: number): void {
    if (day < 0 || day > 6) return;
    const next = new Set(allowedDaysRef.current);
    if (next.has(day)) {
      if (next.size <= 1) return;
      next.delete(day);
    } else {
      next.add(day);
    }
    setAllowedDays(next);
  }

  /** Define o limite diário de revisões. `null` = sem limite; valores < 1 são rejeitados. */
  function setMaxReviewsPerDay(next: number | null): void {
    if (next !== null && (!Number.isInteger(next) || next < 1)) return;
    const previous = maxRef.current;
    saveMax(email, next);
    setMaxState(next);
    persist(allowedDaysRef.current, next, () => {
      saveMax(email, previous);
      setMaxState(previous);
    });
  }

  return { allowedDays, setAllowedDays, toggleDay, maxReviewsPerDay, setMaxReviewsPerDay };
}
