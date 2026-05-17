import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

const ALL_DAYS: ReadonlyArray<number> = [0, 1, 2, 3, 4, 5, 6];

function storageKey(email: string | null | undefined): string {
  return `ebbing_prefs_v1_${email ?? '_guest'}`;
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

/**
 * Hook central das preferências de revisão.
 *
 * Contrato (mesmo padrão de `useSubjects` / `useRoutine`):
 * - Backend (`api.preferences.get/save`) é a fonte de verdade quando há sessão.
 * - localStorage `ebbing_prefs_v1_<email>` é apenas cache otimista.
 * - Re-hidrata e re-busca ao trocar `email`.
 * - `allowedDays` nunca pode ficar vazio: tentativas de setar `Set` vazio são
 *   rejeitadas no client (UI deve impedir, o backend também valida).
 */
export function useReviewPreferences(email: string | null) {
  const [allowedDays, setAllowedDaysState] = useState<Set<number>>(() => load(email));
  const allowedDaysRef = useRef<Set<number>>(allowedDays);

  useEffect(() => {
    allowedDaysRef.current = allowedDays;
  }, [allowedDays]);

  useEffect(() => {
    setAllowedDaysState(load(email));

    if (!email) return;
    if (!localStorage.getItem('ebbing_session')) return;

    let cancelled = false;
    api.preferences
      .get()
      .then((data) => {
        if (cancelled) return;
        const next = new Set(data.allowedReviewDays);
        setAllowedDaysState(next);
        save(email, next);
      })
      .catch((err) => console.error('preferences get failed:', err));

    return () => {
      cancelled = true;
    };
  }, [email]);

  function setAllowedDays(next: Set<number>): void {
    if (next.size === 0) return;
    const previous = allowedDaysRef.current;
    save(email, next);
    setAllowedDaysState(next);
    if (!email) return;
    if (!localStorage.getItem('ebbing_session')) return;
    api.preferences
      .save({ allowedReviewDays: [...next].sort() })
      .catch((err) => {
        console.error('preferences save failed:', err);
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

  return { allowedDays, setAllowedDays, toggleDay };
}
