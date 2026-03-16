import { useState, useCallback, useEffect } from 'react';
import type { Subject } from '../types';
import { loadSubjects, saveSubjects } from '../services/storage';
import { calculateNextReview, resetCiclo } from '../services/algorithm';
import { api } from '../services/api';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSubjects());

  // Sync with API if possible, otherwise use local storage
  useEffect(() => {
    api.subjects.list().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setSubjects(data as Subject[]);
        saveSubjects(data as Subject[]);
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

  const toggleAula = useCallback(
    (id: string) => {
      const subject = subjects.find((s) => s.id === id);
      if (!subject) return;
      updateSubject({ ...subject, aulaAssistida: !subject.aulaAssistida });
    },
    [subjects, updateSubject],
  );

  const togglePreAula = useCallback(
    (id: string) => {
      const subject = subjects.find((s) => s.id === id);
      if (!subject) return;
      updateSubject({ ...subject, preAulaFeita: !subject.preAulaFeita });
    },
    [subjects, updateSubject],
  );

  const toggleFlashcards = useCallback(
    (id: string) => {
      const subject = subjects.find((s) => s.id === id);
      if (!subject) return;
      updateSubject({ ...subject, flashcardsFeitos: !subject.flashcardsFeitos });
    },
    [subjects, updateSubject],
  );

  const registerReview = useCallback(
    (id: string, numCorrect: number) => {
      const subject = subjects.find((s) => s.id === id);
      if (!subject) return;

      const updates = calculateNextReview(subject, numCorrect);
      updateSubject({ ...subject, ...updates });
    },
    [subjects, updateSubject],
  );

  const doResetCiclo = useCallback(
    (id: string) => {
      const subject = subjects.find((s) => s.id === id);
      if (!subject) return;
      updateSubject(resetCiclo(subject));
    },
    [subjects, updateSubject],
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
      
      setSubjects((prev) => {
        const next = [...prev, newSubject];
        saveSubjects(next);
        return next;
      });
      await api.subjects.sync([...subjects, newSubject]);
    },
    [subjects],
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
      const subject = subjects.find((s) => s.id === id);
      if (!subject || !subject.stability) return;
      updateSubject({
        ...subject,
        stability: subject.stability * 0.7
      });
    },
    [subjects, updateSubject],
  );

  return {
    subjects,
    toggleAula,
    togglePreAula,
    toggleFlashcards,
    registerReview,
    doResetCiclo,
    addSubject,
    removeSubject,
    revertStage,
  };
}
