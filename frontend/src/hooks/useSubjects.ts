import { useState, useCallback, useEffect, useRef } from 'react';
import type { Subject, StudentRoutine } from '../types';
import { loadSubjects, saveSubjects } from '../services/storage';
import { calculateNextReview, resetCiclo, localDateStr } from '../services/algorithm';
import { api } from '../services/api';
import type { ReviewEventPayload } from '../services/api';

export type { ReviewEventPayload };

/**
 * Returns the first date within 21 days from `fsrsDate` where the student has
 * a study slot for the given area. Falls back to `fsrsDate` if none found.
 * `scheduledDays` is never modified — only the calendar date shifts.
 */
export function findNextRoutineDate(fsrsDate: string, area: string, routine: StudentRoutine): string {
  if (!routine.length) return fsrsDate;
  const studyDays = new Set(
    routine.filter((s) => s.type === 'study' && (!s.area || s.area === area)).map((s) => s.dayOfWeek),
  );
  if (!studyDays.size) return fsrsDate;
  const base = new Date(fsrsDate + 'T12:00:00');
  for (let i = 0; i <= 21; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    if (studyDays.has(d.getDay())) return localDateStr(d);
  }
  return fsrsDate;
}

export function useSubjects(routine: StudentRoutine = []) {
  const [userEmail] = useState<string | undefined>(() => {
    try {
      const session = localStorage.getItem('ebbing_session');
      return session ? (JSON.parse(session).email ?? undefined) : undefined;
    } catch { return undefined; }
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => loadSubjects(userEmail));
  const [reviewEvents, setReviewEvents] = useState<ReviewEventPayload[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ref que espelha o estado atual de subjects para que callbacks estáveis
   * (useCallback sem subjects na dep array) possam ler o valor mais recente
   * sem causar re-criação desnecessária das funções a cada mudança de estado.
   */
  const subjectsRef = useRef<Subject[]>(subjects);
  useEffect(() => {
    subjectsRef.current = subjects;
  }, [subjects]);

  // API é a fonte de verdade para usuário logado.
  // Sobrescrevemos o estado local com o que o backend retorna — nunca reenviamos
  // itens apenas presentes no localStorage ao backend, pois isso "ressuscitaria"
  // subjects deletados em outra sessão/dispositivo.
  useEffect(() => {
    if (!localStorage.getItem('ebbing_session')) return;
    api.subjects.list().then((data) => {
      if (Array.isArray(data)) {
        const apiSubjects = data as Subject[];
        setSubjects(apiSubjects);
        saveSubjects(apiSubjects, userEmail);
      }
    }).catch(console.error);
  }, [userEmail]);

  // Load review event history on mount
  useEffect(() => {
    if (!localStorage.getItem('ebbing_session')) return;
    api.reviewEvents.list().then(setReviewEvents).catch(console.error);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const updateSubject = useCallback(async (updated: Subject) => {
    const previous = subjectsRef.current.find((s) => s.id === updated.id);
    setSubjects((prev) => {
      const next = prev.map((s) => (s.id === updated.id ? updated : s));
      saveSubjects(next, userEmail);
      return next;
    });
    try {
      await api.subjects.upsert(updated.id, updated);
    } catch (err) {
      console.error('API update failed:', err);
      if (previous) {
        setSubjects((prev) => {
          const rolledBack = prev.map((s) => (s.id === updated.id ? previous : s));
          saveSubjects(rolledBack, userEmail);
          return rolledBack;
        });
      }
      setError('Não foi possível salvar a alteração. Verifique sua conexão.');
    }
  }, [userEmail]);

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

  /** Converte numCorrect (0–10 de 10) para PerformanceLevel. */
  function numCorrectToPerformance(numCorrect: number): string {
    if (numCorrect >= 9) return 'excelente';
    if (numCorrect >= 7) return 'bom';
    if (numCorrect >= 5) return 'medio';
    return 'ruim';
  }

  const registerReview = useCallback(
    (id: string, numCorrect: number, totalQuestions = 10, accuracy = 0, reviewDate?: string, durationSeconds = 0) => {
      const subject = subjectsRef.current.find((s) => s.id === id);
      if (!subject) return;
      const updates = calculateNextReview(subject, numCorrect);
      const snappedDate = updates.nextReviewDate
        ? findNextRoutineDate(updates.nextReviewDate, subject.area, routine)
        : updates.nextReviewDate;
      const updated = { ...subject, ...updates, nextReviewDate: snappedDate ?? null };
      updateSubject(updated);

      // Fire-and-forget: log review event to backend
      const event: ReviewEventPayload = {
        subjectId: subject.id,
        subjectName: subject.aulaPrincipal,
        reviewDate: reviewDate || localDateStr(new Date()),
        performance: numCorrectToPerformance(numCorrect),
        reps: (updated.reps ?? 1),
        questions: totalQuestions,
        accuracy,
        durationSeconds,
      };
      api.reviewEvents.create(event)
        .then((saved) => setReviewEvents((prev) => [saved, ...prev]))
        .catch(console.error);
    },
    [updateSubject],
  );

  const registerFixacao = useCallback(
    (id: string, numCorrect: number, totalQuestions = 10, accuracy = 0, reviewDate?: string, durationSeconds = 0) => {
      const subject = subjectsRef.current.find((s) => s.id === id);
      if (!subject) return;
      // Força cálculo de primeira revisão zerando o estado FSRS
      const fresh = { ...subject, reps: 0, stability: 0, difficulty: 0 };
      const updates = calculateNextReview(fresh, numCorrect);
      const snappedDate = updates.nextReviewDate
        ? findNextRoutineDate(updates.nextReviewDate, subject.area, routine)
        : updates.nextReviewDate;
      const updated = { ...subject, ...updates, nextReviewDate: snappedDate ?? null, flashcardsFeitos: true };
      updateSubject(updated);

      // Fire-and-forget: log fixacao event as reps=1
      const event: ReviewEventPayload = {
        subjectId: subject.id,
        subjectName: subject.aulaPrincipal,
        reviewDate: reviewDate || localDateStr(new Date()),
        performance: numCorrectToPerformance(numCorrect),
        reps: 1,
        questions: totalQuestions,
        accuracy,
        durationSeconds,
      };
      api.reviewEvents.create(event)
        .then((saved) => setReviewEvents((prev) => [saved, ...prev]))
        .catch(console.error);
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

      setSubjects((prev) => {
        const next = [...prev, newSubject];
        saveSubjects(next, userEmail);
        return next;
      });

      try {
        await api.subjects.upsert(newSubject.id, newSubject);
      } catch (err) {
        console.error('API add failed:', err);
        // Rollback: remove o item otimista que não foi persistido
        setSubjects((prev) => {
          const next = prev.filter((s) => s.id !== newSubject.id);
          saveSubjects(next, userEmail);
          return next;
        });
        setError('Não foi possível criar o assunto. Verifique sua conexão.');
      }
    },
    [userEmail],
  );

  const removeSubject = useCallback(async (id: string) => {
    const previous = subjectsRef.current.find((s) => s.id === id);
    setSubjects((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveSubjects(next, userEmail);
      return next;
    });
    try {
      await api.subjects.delete(id);
    } catch (err) {
      console.error('API delete failed:', err);
      if (previous) {
        // Rollback: repõe o item na posição original preservando a ordem anterior.
        setSubjects((prev) => {
          const next = [...prev, previous];
          saveSubjects(next, userEmail);
          return next;
        });
      }
      setError('Não foi possível excluir o assunto. Verifique sua conexão.');
    }
  }, [userEmail]);

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

  /**
   * Re-snaps nextReviewDate of all future-scheduled subjects against an
   * updated routine. Only subjects whose date would actually change are saved.
   * Called after a new routine slot is added so existing schedules align.
   */
  const rescheduleByRoutine = useCallback(
    (updatedRoutine: StudentRoutine) => {
      const today = localDateStr(new Date());
      for (const s of subjectsRef.current) {
        if (!s.nextReviewDate || s.nextReviewDate < today) continue;
        const snapped = findNextRoutineDate(s.nextReviewDate, s.area, updatedRoutine);
        if (snapped !== s.nextReviewDate) {
          updateSubject({ ...s, nextReviewDate: snapped });
        }
      }
    },
    [updateSubject],
  );

  return {
    subjects,
    reviewEvents,
    error,
    clearError,
    toggleAula,
    togglePreAula,
    toggleFlashcards,
    registerReview,
    registerFixacao,
    doResetCiclo,
    addSubject,
    removeSubject,
    revertStage,
    rescheduleByRoutine,
  };
}
