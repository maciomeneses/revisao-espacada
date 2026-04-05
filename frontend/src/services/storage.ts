import type { Subject } from '../types';
import { INITIAL_SUBJECTS } from '../data/initialSubjects';

// Legacy guest key (kept for backwards-compat clearing if needed)
const GUEST_STORAGE_KEY = 'revisaENEM_subjects_v1';
// Per-user key prefix
const USER_STORAGE_KEY_PREFIX = 'revisaENEM_subjects_v2';

function getUserKey(email: string): string {
  return `${USER_STORAGE_KEY_PREFIX}_${email}`;
}

/**
 * Carrega subjects do localStorage.
 * - Com email: retorna o cache do usuário (ou [] se não houver cache).
 * - Sem email (guest): retorna INITIAL_SUBJECTS com filtragem para mudanças de versão.
 */
export function loadSubjects(userEmail?: string): Subject[] {
  if (userEmail) {
    try {
      const raw = localStorage.getItem(getUserKey(userEmail));
      if (!raw) return [];
      return JSON.parse(raw) as Subject[];
    } catch {
      return [];
    }
  }
  // Guest path
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return INITIAL_SUBJECTS;
    const parsed = JSON.parse(raw) as Subject[];
    const validIds = new Set(INITIAL_SUBJECTS.map((s) => s.id));
    const filtered = parsed.filter((s) => validIds.has(s.id));
    const existingIds = new Set(filtered.map((s) => s.id));
    const newSubjects = INITIAL_SUBJECTS.filter((s) => !existingIds.has(s.id));
    return [...filtered, ...newSubjects];
  } catch {
    return INITIAL_SUBJECTS;
  }
}

export function saveSubjects(subjects: Subject[], userEmail?: string): void {
  if (userEmail) {
    localStorage.setItem(getUserKey(userEmail), JSON.stringify(subjects));
  } else {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(subjects));
  }
}

export function clearSubjects(userEmail?: string): void {
  if (userEmail) {
    localStorage.removeItem(getUserKey(userEmail));
  } else {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  }
}
