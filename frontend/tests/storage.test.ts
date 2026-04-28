import { describe, it, expect, beforeEach } from 'vitest';
import { loadSubjects, saveSubjects, clearSubjects } from '../src/services/storage';
import type { Subject } from '../src/types';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const EMAIL = 'user@example.com';
const USER_KEY = `revisaENEM_subjects_v2_${EMAIL}`;

function makeSubject(id: string, overrides: Partial<Subject> = {}): Subject {
  return {
    id,
    modulo: 'M', area: 'A', aulaPrincipal: 'Aula', relevancia: 'Alta',
    aulaAssistida: false, preAulaFeita: false, flashcardsFeitos: false,
    currentStage: 'aula', nextReviewDate: null, lastReviewDate: null,
    lastPerformance: null, performanceLevel: 'nao_classificada',
    ...overrides,
  } as Subject;
}

describe('storage service', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('loadSubjects', () => {
    it('retorna [] quando userEmail é undefined', () => {
      expect(loadSubjects()).toEqual([]);
    });

    it('retorna [] quando não há cache do usuário', () => {
      expect(loadSubjects(EMAIL)).toEqual([]);
    });

    it('retorna o cache do usuário quando existe', () => {
      const stored = [makeSubject('s1', { aulaAssistida: true })];
      localStorageMock.setItem(USER_KEY, JSON.stringify(stored));

      const result = loadSubjects(EMAIL);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
      expect(result[0].aulaAssistida).toBe(true);
    });

    it('retorna [] quando JSON no storage é inválido', () => {
      localStorageMock.setItem(USER_KEY, 'nao_e_json_valido{{{');
      expect(loadSubjects(EMAIL)).toEqual([]);
    });

    it('isola caches entre usuários diferentes', () => {
      localStorageMock.setItem(USER_KEY, JSON.stringify([makeSubject('a1')]));
      localStorageMock.setItem(
        'revisaENEM_subjects_v2_other@example.com',
        JSON.stringify([makeSubject('b1'), makeSubject('b2')]),
      );

      expect(loadSubjects(EMAIL)).toHaveLength(1);
      expect(loadSubjects('other@example.com')).toHaveLength(2);
    });
  });

  describe('saveSubjects', () => {
    it('persiste subjects no key do usuário', () => {
      const subjects = [makeSubject('s1', { aulaAssistida: true })];
      saveSubjects(subjects, EMAIL);

      const raw = localStorageMock.getItem(USER_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed[0].id).toBe('s1');
      expect(parsed[0].aulaAssistida).toBe(true);
    });

    it('não escreve no localStorage quando userEmail é undefined', () => {
      saveSubjects([makeSubject('ghost')]);
      expect(localStorageMock.getItem('revisaENEM_subjects_v1')).toBeNull();
      expect(localStorageMock.getItem(USER_KEY)).toBeNull();
    });
  });

  describe('clearSubjects', () => {
    it('remove a chave do usuário', () => {
      localStorageMock.setItem(USER_KEY, '[]');
      clearSubjects(EMAIL);
      expect(localStorageMock.getItem(USER_KEY)).toBeNull();
    });

    it('não faz nada quando userEmail é undefined', () => {
      localStorageMock.setItem(USER_KEY, '[]');
      clearSubjects();
      expect(localStorageMock.getItem(USER_KEY)).toBe('[]');
    });
  });
});
