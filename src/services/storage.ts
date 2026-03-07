import type { Subject } from '../types';
import { INITIAL_SUBJECTS } from '../data/initialSubjects';

const STORAGE_KEY = 'revisaENEM_subjects_v1';

export function loadSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SUBJECTS;
    const parsed = JSON.parse(raw) as Subject[];
    // Merge: keep existing subjects, add any new ones from initial data
    const existingIds = new Set(parsed.map((s) => s.id));
    const newSubjects = INITIAL_SUBJECTS.filter((s) => !existingIds.has(s.id));
    return [...parsed, ...newSubjects];
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
