import type { Subject } from '../types';

// Per-user key prefix
const USER_STORAGE_KEY_PREFIX = 'revisaENEM_subjects_v2';

function getUserKey(email: string): string {
  return `${USER_STORAGE_KEY_PREFIX}_${email}`;
}

/**
 * Carrega subjects do cache local do usuário.
 * - Com email: retorna o cache do usuário (ou [] se não houver cache).
 * - Sem email: retorna [] — o app exige login e não há fluxo guest.
 */
export function loadSubjects(userEmail?: string): Subject[] {
  if (!userEmail) return [];
  try {
    const raw = localStorage.getItem(getUserKey(userEmail));
    if (!raw) return [];
    return JSON.parse(raw) as Subject[];
  } catch {
    return [];
  }
}

export function saveSubjects(subjects: Subject[], userEmail?: string): void {
  if (!userEmail) return;
  localStorage.setItem(getUserKey(userEmail), JSON.stringify(subjects));
}

export function clearSubjects(userEmail?: string): void {
  if (!userEmail) return;
  localStorage.removeItem(getUserKey(userEmail));
}

const ROUTINE_KEY_PREFIX = 'ebbing_routine_v2';

export function routineStorageKey(email: string | null | undefined): string {
  return `${ROUTINE_KEY_PREFIX}_${email ?? '_guest'}`;
}

/** Limpa o cache local da rotina do usuário (chave v2). */
export function clearRoutine(userEmail?: string | null): void {
  localStorage.removeItem(routineStorageKey(userEmail ?? null));
}
