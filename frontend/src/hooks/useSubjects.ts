import { useState, useCallback, useEffect, useRef } from 'react';
import type { Subject, StudentRoutine } from '../types';
import { loadSubjects, saveSubjects } from '../services/storage';
import { calculateNextReview, resetCiclo, localDateStr } from '../services/algorithm';
import { api } from '../services/api';
import type { ReviewEventPayload } from '../services/api';

export type { ReviewEventPayload };

/** Opções de capacidade diária para `snapReviewDate`. */
export interface SnapCapacityOptions {
  /** Teto de revisões por dia. `null`/`undefined`/0 = sem limite. */
  maxPerDay?: number | null;
  /**
   * Carga atual por data (`YYYY-MM-DD` → nº de revisões já agendadas),
   * excluindo o próprio subject sendo agendado.
   */
  dayLoad?: ReadonlyMap<string, number>;
}

/**
 * Conta quantos subjects têm `nextReviewDate` em cada data, excluindo
 * `excludeId` (o subject que está sendo reagendado não conta contra si mesmo).
 */
export function buildDayLoad(subjects: Subject[], excludeId?: string): Map<string, number> {
  const load = new Map<string, number>();
  for (const s of subjects) {
    if (s.id === excludeId || !s.nextReviewDate) continue;
    load.set(s.nextReviewDate, (load.get(s.nextReviewDate) ?? 0) + 1);
  }
  return load;
}

/**
 * Snaps `fsrsDate` to the first date (within 21 days) that satisfies:
 *   - the student's `routine` (a study slot for the given area, or a generic slot),
 *   - `allowedDays` (Set of dayOfWeek 0..6) if provided and non-empty, and
 *   - daily capacity (`opts.maxPerDay` + `opts.dayLoad`) if provided.
 *
 * Routine priority: days with a slot dedicated to the subject's `area` are
 * tried FIRST; generic study slots (no area) are only a fallback. Without
 * this, a generic "Estudos" slot earlier in the week would swallow the
 * review before it could reach the day the student actually studies the
 * subject.
 *
 * Fallback rules:
 *   1. If no area-specific day works within 21 days, try any study day
 *      (generic or area-specific).
 *   2. If no study day works, pick the first day within 21 days that lies in
 *      `allowedDays` and has capacity (routine is a preference; allowedDays
 *      is a hard restriction).
 *   3. If every candidate day in the horizon is at capacity, pick the least
 *      loaded day that respects `allowedDays` (earliest wins ties) — a date is
 *      never dropped and `allowedDays` is never violated.
 *   4. If even that fails (allowedDays empty / undefined and no capacity
 *      constraint), return `fsrsDate`.
 *
 * The date never moves earlier than `fsrsDate`. `routine` is never modified —
 * only the calendar date shifts.
 */
export function snapReviewDate(
  fsrsDate: string,
  area: string,
  routine: StudentRoutine,
  allowedDays?: Set<number>,
  opts?: SnapCapacityOptions,
): string {
  // Dias com slot dedicado à área do subject (prioridade máxima).
  const areaDays = new Set(
    routine.filter((s) => s.type === 'study' && s.area === area).map((s) => s.dayOfWeek),
  );
  // Qualquer dia de estudo aplicável: slot da área ou slot genérico (sem área).
  const studyDays = new Set(
    routine
      .filter((s) => s.type === 'study' && (!s.area || s.area === area))
      .map((s) => s.dayOfWeek),
  );
  const hasAllowed = allowedDays !== undefined && allowedDays.size > 0;
  const hasStudy = studyDays.size > 0;
  const maxPerDay = opts?.maxPerDay ?? 0;
  const hasCapacityLimit = maxPerDay > 0 && opts?.dayLoad !== undefined;
  const loadOf = (dateStr: string) => opts?.dayLoad?.get(dateStr) ?? 0;
  const capacityOk = (dateStr: string) => !hasCapacityLimit || loadOf(dateStr) < maxPerDay;

  const base = new Date(fsrsDate + 'T12:00:00');
  const dateAt = (i: number) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  };

  // 0) prioridade: dia com slot dedicado à área ∩ allowedDays ∩ capacidade
  if (areaDays.size > 0) {
    for (let i = 0; i <= 21; i++) {
      const d = dateAt(i);
      const dow = d.getDay();
      const dateStr = localDateStr(d);
      const allowedOk = !hasAllowed || allowedDays!.has(dow);
      if (allowedOk && areaDays.has(dow) && capacityOk(dateStr)) return dateStr;
    }
  }

  // 1) qualquer dia de estudo (genérico ou da área) ∩ allowedDays ∩ capacidade
  for (let i = 0; i <= 21; i++) {
    const d = dateAt(i);
    const dow = d.getDay();
    const dateStr = localDateStr(d);
    const allowedOk = !hasAllowed || allowedDays!.has(dow);
    const studyOk = !hasStudy || studyDays.has(dow);
    if (allowedOk && studyOk && capacityOk(dateStr)) return dateStr;
  }

  // 2) fallback: primeiro dia em allowedDays com capacidade, ignorando rotina
  if (hasAllowed) {
    for (let i = 0; i <= 21; i++) {
      const d = dateAt(i);
      const dateStr = localDateStr(d);
      if (allowedDays!.has(d.getDay()) && capacityOk(dateStr)) return dateStr;
    }
  }

  // 3) horizonte inteiro lotado: dia permitido menos carregado (empate = mais cedo).
  //    allowedDays continua restrição forte; nunca deixar o subject sem data.
  if (hasCapacityLimit) {
    let bestDate: string | null = null;
    let bestLoad = Infinity;
    for (let i = 0; i <= 21; i++) {
      const d = dateAt(i);
      if (hasAllowed && !allowedDays!.has(d.getDay())) continue;
      const dateStr = localDateStr(d);
      const load = loadOf(dateStr);
      if (load < bestLoad) {
        bestLoad = load;
        bestDate = dateStr;
      }
    }
    if (bestDate !== null) return bestDate;
  }

  // 4) nada encontrado
  return fsrsDate;
}

/**
 * Back-compat alias para `snapReviewDate` sem restrição de `allowedDays`.
 * Mantido para não quebrar callers/testes existentes.
 */
export function findNextRoutineDate(
  fsrsDate: string,
  area: string,
  routine: StudentRoutine,
): string {
  return snapReviewDate(fsrsDate, area, routine, undefined);
}

/**
 * Hook central de subjects + sincronização FSRS.
 *
 * Contrato com o consumidor (App.tsx):
 * - `userEmail` é a única fonte de verdade da identidade do usuário no hook.
 *   Deve ser passado pelo caller a partir de um state reativo (atualizado em
 *   handleLogin/handleLogout). Não lemos `ebbing_session` aqui pra capturar
 *   identidade — fazer isso em closure causou o bug #9 (3 matérias após login).
 * - O hook reage a mudanças de `userEmail` re-hidratando o cache local e
 *   buscando a lista do backend.
 * - Sem `userEmail`, o hook fica inativo (nem cache, nem rede, nem mutações).
 *
 * Fonte de verdade:
 * - Backend (via `api.subjects.list/upsert/delete`) é autoritativo.
 * - localStorage (per-user key `revisaENEM_subjects_v2_<email>`) é apenas cache
 *   otimista para hidratação rápida e rollback de mutações falhas.
 * - Mutações exigem `userEmail` válido — sem ele, `saveSubjects` é no-op e
 *   nada é gravado no localStorage (ver storage.ts).
 */
export function useSubjects(
  routine: StudentRoutine = [],
  userEmail?: string,
  allowedDays?: Set<number>,
  maxReviewsPerDay?: number | null,
) {
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSubjects(userEmail));
  const [reviewEvents, setReviewEvents] = useState<ReviewEventPayload[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Re-hidrata o cache local quando userEmail muda (login, logout, troca de
  // usuário). O efeito de fetch da API (abaixo) sobrescreve isso assim que a
  // resposta chega, mas o cache evita um "flash" de lista vazia no login.
  useEffect(() => {
    setSubjects(loadSubjects(userEmail));
  }, [userEmail]);

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
    if (!userEmail) return;
    if (!localStorage.getItem('ebbing_session')) return;
    api.subjects
      .list()
      .then((data) => {
        if (Array.isArray(data)) {
          const apiSubjects = data as Subject[];
          setSubjects(apiSubjects);
          saveSubjects(apiSubjects, userEmail);
        }
      })
      .catch(console.error);
  }, [userEmail]);

  // Load review event history on mount
  useEffect(() => {
    if (!localStorage.getItem('ebbing_session')) return;
    api.reviewEvents.list().then(setReviewEvents).catch(console.error);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const updateSubject = useCallback(
    async (updated: Subject) => {
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
    },
    [userEmail],
  );

  // Re-snap automático: quando routine, allowedDays ou subjects mudam, garante
  // que toda nextReviewDate futura respeita as restrições atuais. Cobre o caso
  // em que routine/allowedDays chegam do backend depois do fetch de subjects,
  // ou em que slots foram editados/removidos (updateSlot/removeSlot/toggleDay
  // não disparam rescheduleByRoutine). A guarda `snapped !== s.nextReviewDate`
  // garante convergência em 1-2 iterações.
  useEffect(() => {
    if (!userEmail) return;
    if (!allowedDays || allowedDays.size === 0) return;
    const today = localDateStr(new Date());
    // Mapa de carga incremental: cada subject é removido da própria data antes
    // de snapar e recolocado na data resultante, para que a capacidade reflita
    // as decisões já tomadas nesta passada (ordem determinística → convergência).
    const load = buildDayLoad(subjects);
    for (const s of subjects) {
      if (!s.nextReviewDate || s.nextReviewDate < today) continue;
      load.set(s.nextReviewDate, Math.max(0, (load.get(s.nextReviewDate) ?? 1) - 1));
      const snapped = snapReviewDate(s.nextReviewDate, s.area, routine, allowedDays, {
        maxPerDay: maxReviewsPerDay,
        dayLoad: load,
      });
      load.set(snapped, (load.get(snapped) ?? 0) + 1);
      if (snapped !== s.nextReviewDate) {
        updateSubject({ ...s, nextReviewDate: snapped });
      }
    }
  }, [routine, allowedDays, maxReviewsPerDay, subjects, userEmail, updateSubject]);

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
    (
      id: string,
      numCorrect: number,
      totalQuestions = 10,
      accuracy = 0,
      reviewDate?: string,
      durationSeconds = 0,
    ) => {
      const subject = subjectsRef.current.find((s) => s.id === id);
      if (!subject) return;
      const updates = calculateNextReview(subject, numCorrect);
      const snappedDate = updates.nextReviewDate
        ? snapReviewDate(updates.nextReviewDate, subject.area, routine, allowedDays, {
            maxPerDay: maxReviewsPerDay,
            dayLoad: buildDayLoad(subjectsRef.current, subject.id),
          })
        : updates.nextReviewDate;
      const updated = { ...subject, ...updates, nextReviewDate: snappedDate ?? null };
      updateSubject(updated);

      // Fire-and-forget: log review event to backend
      const event: ReviewEventPayload = {
        subjectId: subject.id,
        subjectName: subject.aulaPrincipal,
        reviewDate: reviewDate || localDateStr(new Date()),
        performance: numCorrectToPerformance(numCorrect),
        reps: updated.reps ?? 1,
        questions: totalQuestions,
        accuracy,
        durationSeconds,
      };
      api.reviewEvents
        .create(event)
        .then((saved) => setReviewEvents((prev) => [saved, ...prev]))
        .catch(console.error);
    },
    [updateSubject, routine, allowedDays, maxReviewsPerDay],
  );

  const registerFixacao = useCallback(
    (
      id: string,
      numCorrect: number,
      totalQuestions = 10,
      accuracy = 0,
      reviewDate?: string,
      durationSeconds = 0,
    ) => {
      const subject = subjectsRef.current.find((s) => s.id === id);
      if (!subject) return;
      // Força cálculo de primeira revisão zerando o estado FSRS
      const fresh = { ...subject, reps: 0, stability: 0, difficulty: 0 };
      const updates = calculateNextReview(fresh, numCorrect);
      const snappedDate = updates.nextReviewDate
        ? snapReviewDate(updates.nextReviewDate, subject.area, routine, allowedDays, {
            maxPerDay: maxReviewsPerDay,
            dayLoad: buildDayLoad(subjectsRef.current, subject.id),
          })
        : updates.nextReviewDate;
      const updated = {
        ...subject,
        ...updates,
        nextReviewDate: snappedDate ?? null,
        flashcardsFeitos: true,
      };
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
      api.reviewEvents
        .create(event)
        .then((saved) => setReviewEvents((prev) => [saved, ...prev]))
        .catch(console.error);
    },
    [updateSubject, routine, allowedDays, maxReviewsPerDay],
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
        // Flags legados explícitos: o contrato do backend os aceita ausentes,
        // mas versões anteriores (boolean primitivo no SubjectDto) rejeitam o
        // payload sem eles — enviar sempre evita 500 durante janelas de deploy.
        fixacao24hFeita: false,
        estudoReversoFeito: false,
        rev7dFeita: false,
        rev30dFeita: false,
        rev60dFeita: false,
        rev90dFeita: false,
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

  const removeSubject = useCallback(
    async (id: string) => {
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
    },
    [userEmail],
  );

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
      // Mesmo padrão de carga incremental do efeito de re-snap acima.
      const load = buildDayLoad(subjectsRef.current);
      for (const s of subjectsRef.current) {
        if (!s.nextReviewDate || s.nextReviewDate < today) continue;
        load.set(s.nextReviewDate, Math.max(0, (load.get(s.nextReviewDate) ?? 1) - 1));
        const snapped = snapReviewDate(s.nextReviewDate, s.area, updatedRoutine, allowedDays, {
          maxPerDay: maxReviewsPerDay,
          dayLoad: load,
        });
        load.set(snapped, (load.get(snapped) ?? 0) + 1);
        if (snapped !== s.nextReviewDate) {
          updateSubject({ ...s, nextReviewDate: snapped });
        }
      }
    },
    [updateSubject, allowedDays, maxReviewsPerDay],
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
