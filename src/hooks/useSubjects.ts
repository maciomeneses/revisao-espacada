import { useState, useCallback } from 'react';
import type { Performance, Subject } from '../types';
import { loadSubjects, saveSubjects } from '../services/storage';
import { computeStageTransition, addDays, today, resetCiclo } from '../services/algorithm';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSubjects());

  const updateSubject = useCallback((updated: Subject) => {
    setSubjects((prev) => {
      const next = prev.map((s) => (s.id === updated.id ? updated : s));
      saveSubjects(next);
      return next;
    });
  }, []);

  const toggleAula = useCallback(
    (id: string) => {
      const subject = subjects.find((s) => s.id === id);
      if (!subject) return;

      const wasAssistida = subject.aulaAssistida;
      const updated: Subject = {
        ...subject,
        aulaAssistida: !wasAssistida,
        currentStage: !wasAssistida ? 'fixacao' : 'aula',
        nextReviewDate: !wasAssistida ? addDays(new Date(), 1) : null,
        lastReviewDate: !wasAssistida ? today() : null,
      };
      updateSubject(updated);
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

  /**
   * Called when the student completes a review stage and records their performance.
   * Returns false if the stage is not the current pending one.
   */
  const registerReview = useCallback(
    (id: string, performance: Performance) => {
      const subject = subjects.find((s) => s.id === id);
      if (!subject) return;

      const transition = computeStageTransition(
        subject.currentStage,
        subject.relevancia,
        performance,
      );

      const nowDate = new Date();
      const nextDate =
        transition.nextStage === 'concluido'
          ? null
          : addDays(nowDate, transition.daysUntilNext);

      // Mark the current stage as completed if passed
      const stageFlags: Partial<Subject> = {};
      if (transition.stageCompleted) {
        switch (subject.currentStage) {
          case 'fixacao':
            stageFlags.fixacao24hFeita = true;
            break;
          case 'estudo_reverso':
            stageFlags.estudoReversoFeito = true;
            break;
          case 'rev7d':
            stageFlags.rev7dFeita = true;
            break;
          case 'rev30d':
            stageFlags.rev30dFeita = true;
            break;
          case 'rev60d':
            stageFlags.rev60dFeita = true;
            break;
          case 'rev90d':
            stageFlags.rev90dFeita = true;
            break;
        }
      }

      // Derive performance level for board view
      const performanceLevel: Subject['performanceLevel'] =
        performance === 'gte_80'
          ? 'gte_80'
          : performance === 'range_61_79'
            ? 'range_61_79'
            : 'lte_60';

      const updated: Subject = {
        ...subject,
        ...stageFlags,
        currentStage: transition.nextStage,
        nextReviewDate: nextDate,
        lastReviewDate: today(),
        lastPerformance: performance,
        performanceLevel,
      };
      updateSubject(updated);
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

  return {
    subjects,
    toggleAula,
    togglePreAula,
    toggleFlashcards,
    registerReview,
    doResetCiclo,
  };
}
