import type { Subject } from '../types';
import { INITIAL_SUBJECTS } from '../data/initialSubjects';

const STORAGE_KEY = 'revisaENEM_subjects_v1';

export function loadSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SUBJECTS;
    const parsed = JSON.parse(raw) as Subject[];
    const validIds = new Set(INITIAL_SUBJECTS.map((s) => s.id));
    // Remove subjects that no longer exist in INITIAL_SUBJECTS (e.g. old generic history)
    const filtered = parsed.filter((s) => validIds.has(s.id));
    // Add any new subjects from INITIAL_SUBJECTS not yet in storage
    const existingIds = new Set(filtered.map((s) => s.id));
    const newSubjects = INITIAL_SUBJECTS.filter((s) => !existingIds.has(s.id));
    return [...filtered, ...newSubjects];
  } catch {
    return INITIAL_SUBJECTS;
  }
}

export function saveSubjects(subjects: Subject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

export function clearSubjects(): void {
  localStorage.removeItem(STORAGE_KEY);
}
