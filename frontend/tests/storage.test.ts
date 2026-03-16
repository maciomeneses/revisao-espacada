import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSubjects, saveSubjects, clearSubjects } from '../src/services/storage';
import type { Subject } from '../src/types';

// Mock de INITIAL_SUBJECTS para isolar os testes do arquivo de dados real
vi.mock('../src/data/initialSubjects', () => ({
  INITIAL_SUBJECTS: [
    {
      id: 'initial-1',
      modulo: 'M1', area: 'A1', aulaPrincipal: 'Aula 1', relevancia: 'Alta',
      aulaAssistida: false, preAulaFeita: false, flashcardsFeitos: false,
      currentStage: 'aula', nextReviewDate: null, lastReviewDate: null,
      lastPerformance: null, performanceLevel: 'nao_classificada',
    },
    {
      id: 'initial-2',
      modulo: 'M2', area: 'A2', aulaPrincipal: 'Aula 2', relevancia: 'Média',
      aulaAssistida: false, preAulaFeita: false, flashcardsFeitos: false,
      currentStage: 'aula', nextReviewDate: null, lastReviewDate: null,
      lastPerformance: null, performanceLevel: 'nao_classificada',
    },
  ] as Subject[],
}));

// Mock simples do localStorage
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

describe('storage service', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('loadSubjects', () => {
    it('retorna INITIAL_SUBJECTS quando storage está vazio', () => {
      const result = loadSubjects();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('initial-1');
    });

    it('mescla subjects do storage com INITIAL_SUBJECTS adicionando novos', () => {
      // Salva apenas o initial-1 no storage
      const stored: Subject[] = [{
        id: 'initial-1',
        modulo: 'M1-modificado', area: 'A1', aulaPrincipal: 'Aula 1', relevancia: 'Alta',
        aulaAssistida: true, preAulaFeita: false, flashcardsFeitos: false,
        currentStage: 'Learning', nextReviewDate: '2026-03-20', lastReviewDate: '2026-03-16',
        lastPerformance: '3', performanceLevel: 'bom',
      }];
      localStorageMock.setItem('revisaENEM_subjects_v1', JSON.stringify(stored));

      const result = loadSubjects();
      // initial-2 deve ser adicionado
      expect(result).toHaveLength(2);
      // initial-1 mantém o progresso salvo
      const s1 = result.find(s => s.id === 'initial-1')!;
      expect(s1.aulaAssistida).toBe(true);
      expect(s1.currentStage).toBe('Learning');
    });

    it('filtra subjects do storage que não existem mais em INITIAL_SUBJECTS', () => {
      const stored: Subject[] = [
        {
          id: 'obsoleto-123',
          modulo: 'M-old', area: 'A-old', aulaPrincipal: 'Aula old', relevancia: 'Baixa',
          aulaAssistida: false, preAulaFeita: false, flashcardsFeitos: false,
          currentStage: 'aula', nextReviewDate: null, lastReviewDate: null,
          lastPerformance: null, performanceLevel: 'nao_classificada',
        },
      ];
      localStorageMock.setItem('revisaENEM_subjects_v1', JSON.stringify(stored));

      const result = loadSubjects();
      // 'obsoleto-123' não existe em INITIAL_SUBJECTS — deve ser filtrado
      // ambos do initial devem estar presentes
      expect(result).toHaveLength(2);
      expect(result.every(s => s.id !== 'obsoleto-123')).toBe(true);
    });

    it('retorna INITIAL_SUBJECTS quando JSON no storage é inválido', () => {
      localStorageMock.setItem('revisaENEM_subjects_v1', 'nao_e_json_valido{{{');
      const result = loadSubjects();
      expect(result).toHaveLength(2);
    });
  });

  describe('saveSubjects', () => {
    it('persiste subjects no localStorage em formato JSON', () => {
      const subjects: Subject[] = [{
        id: 'initial-1',
        modulo: 'M1', area: 'A1', aulaPrincipal: 'Aula 1', relevancia: 'Alta',
        aulaAssistida: true, preAulaFeita: false, flashcardsFeitos: false,
        currentStage: 'Review', nextReviewDate: '2026-03-20', lastReviewDate: '2026-03-16',
        lastPerformance: '3', performanceLevel: 'bom',
      }];
      saveSubjects(subjects);

      const raw = localStorageMock.getItem('revisaENEM_subjects_v1');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed[0].id).toBe('initial-1');
      expect(parsed[0].aulaAssistida).toBe(true);
    });
  });

  describe('clearSubjects', () => {
    it('remove a chave do localStorage', () => {
      localStorageMock.setItem('revisaENEM_subjects_v1', '[]');
      clearSubjects();
      expect(localStorageMock.getItem('revisaENEM_subjects_v1')).toBeNull();
    });
  });
});
