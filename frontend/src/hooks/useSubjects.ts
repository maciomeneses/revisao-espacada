import { useState, useCallback, useEffect, useRef } from 'react';
import type { Subject } from '../types';
import { loadSubjects, saveSubjects } from '../services/storage';
import { calculateNextReview, resetCiclo } from '../services/algorithm';
import { api } from '../services/api';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSubjects());

  /**
   * Ref que espelha o estado atual de subjects para que callbacks estáveis
   * (useCallback sem subjects na dep array) possam ler o valor mais recente
   * sem causar re-criação desnecessária das funções a cada mudança de estado.
   */
  const subjectsRef = useRef<Subject[]>(subjects);
  useEffect(() => {
    subjectsRef.current = subjects;
  }, [subjects]);

  // Sync with API if possible, merging with local state
  useEffect(() => {
    api.subjects.list().then((data) => {
      if (Array.isArray(data)) {
        setSubjects((prev) => {
          // apiMap contains subjects already in the DB (with progress)
          const apiMap = new Map((data as Subject[]).map(s => [s.id, s]));

          // Merge: For each subject in current state (which has all INITIAL_SUBJECTS),
          // use the API version if it exists, otherwise keep current.
          const merged = prev.map(s => apiMap.get(s.id) || s);

          // Also include any subjects from API that weren't in our initial list (user created)
          const currentIds = new Set(prev.map(s => s.id));
          const userCreated = (data as Subject[]).filter(s => !currentIds.has(s.id));

          const final = [...merged, ...userCreated];
          saveSubjects(final);

          // If the database is missing subjects, push them up
          if (data.length < final.length) {
            api.subjects.sync(final).catch(console.error);
          }

          return final;
        });
      }
    }).catch(console.error);
  }, []);

  const updateSubject = useCallback(async (updated: Subject) => {
    setSubjects((prev) => {
      const next = prev.map((s) => (s.id === updated.id ? updated : s));
      saveSubjects(next);
      return next;
    });
    try {
      await api.subjects.upsert(updated.id, updated);
    } catch (err) {
      console.error('API update failed:', err);
    }
  }, []);

  /**
   * Usa subjectsRef para ler o estado atual sem declarar subjects como
   * dependência — evita re-criação do callback a cada atualização de subjects.
   */
  const toggleAula = useCallback(
    (id: string) => {
      const subject = subjectsRef.current.find((s) => s.id === id);
      if (!subject) return;
      updateSubject({ ...subject, aulaAssistida: !subject.aulaAssistida });
    },
    [updateSubject],
  );

  const togglePreAula = useCallback(
    (id: string) => {
      const subject = subjectsRef.current.find((s) => s.id === id);
      if (!subject) return;
      updateSubject({ ...subject, preAulaFeita: !subject.preAulaFeita });
    },
    [updateSubject],
  );

  const toggleFlashcards = useCallback(
    (id: string) => {
      const subject = subjectsRef.current.find((s) => s.id === id);
      if (!subject) return;
      updateSubject({ ...subject, flashcardsFeitos: !subject.flashcardsFeitos });
    },
    [updateSubject],
  );

  const registerReview = useCallback(
    (id: string, numCorrect: number) => {
      const subject = subjectsRef.current.find((s) => s.id === id);
      if (!subject) return;
      const updates = calculateNextReview(subject, numCorrect);
      updateSubject({ ...subject, ...updates });
    },
    [updateSubject],
  );

  const registerFixacao = useCallback(
    (id: string, numCorrect: number) => {
      const subject = subjectsRef.current.find((s) => s.id === id);
      if (!subject) return;
      // Força cálculo de primeira revisão zerando o estado FSRS
      const fresh = { ...subject, reps: 0, stability: 0, difficulty: 0 };
      const updates = calculateNextReview(fresh, numCorrect);
      updateSubject({ ...subject, ...updates, flashcardsFeitos: true });
    },
    [updateSubject],
  );

  const doResetCiclo = useCallback(
    (id: string) => {
      const subject = subjectsRef.current.find((s) => s.id === id);
      if (!subject) return;
      updateSubject(resetCiclo(subject));
    },
    [updateSubject],
  );

  const addSubject = useCallback(
    async (data: Partial<Subject>) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const newSubject: Subject = {
        id,
        modulo: '',
        area: '',
        aulaPrincipal: '',
        relevancia: 'Alta',
        aulaAssistida: false,
        preAulaFeita: false,
        flashcardsFeitos: false,
        currentStage: 'aula',
        nextReviewDate: null,
        lastReviewDate: null,
        lastPerformance: null,
        performanceLevel: 'nao_classificada',
        ...data,
      } as Subject;

      // Use functional updater to avoid stale closure — capture the resulting list
      // for the sync call via a ref to avoid re-adding subjects as a dependency.
      let nextSubjects: Subject[] = [];
      setSubjects((prev) => {
        nextSubjects = [...prev, newSubject];
        saveSubjects(nextSubjects);
        return nextSubjects;
      });
      // nextSubjects is set synchronously inside setSubjects callback
      await api.subjects.sync(nextSubjects).catch(console.error);
    },
    [],
  );

  const removeSubject = useCallback((id: string) => {
    setSubjects((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveSubjects(next);
      return next;
    });
    api.subjects.delete(id).catch(console.error);
  }, []);

  const revertStage = useCallback(
    (id: string) => {
      const subject = subjectsRef.current.find((s) => s.id === id);
      if (!subject || !subject.stability) return;
      updateSubject({
        ...subject,
        stability: subject.stability * 0.7,
      });
    },
    [updateSubject],
  );

  return {
    subjects,
    toggleAula,
    togglePreAula,
    toggleFlashcards,
    registerReview,
    registerFixacao,
    doResetCiclo,
    addSubject,
    removeSubject,
    revertStage,
  };
}
