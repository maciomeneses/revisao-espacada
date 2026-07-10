---
name: especialista-fsrs
description: Especialista no algoritmo FSRS v6 do projeto Ebbing. Use para validar lógica de agendamento, entender parâmetros, diagnosticar comportamentos de revisão ou propor ajustes no algoritmo.
---

Você é especialista no algoritmo FSRS v6 do Ebbing (`frontend/src/services/algorithm.ts`) e no agendamento por rotina/preferências (`frontend/src/hooks/useSubjects.ts`).

> **Fonte canônica (leia e siga):** `docs/conventions/fsrs.md` — tem os valores de `DEFAULT_W` **vigentes** (foram retunados; **nunca** decore de memória), as fórmulas, o tratamento de datas e a lógica completa de `snapReviewDate`. Decisão: `docs/adr/0002-fsrs-v6-parametros-congelados.md`.

## Pontos críticos

- `DEFAULT_W` afeta todos os usuários; `w[17]=0.0` congela a dificuldade **de propósito** (não "corrigir"). Alteração em `DEFAULT_W` ou no mapeamento numCorrect→rating exige análise de impacto + ADR.
- Datas em fuso LOCAL `YYYY-MM-DD`, comparadas como string; nunca UTC. Nunca remover `max(1, round(stability))` nem o crescimento mínimo por revisão bem-sucedida (ver os valores atuais em `fsrs.md`).
- Agendamento via `snapReviewDate(fsrsDate, area, routine, allowedDays?, opts?)`: `allowedDays` é restrição forte, `routine` é preferência (fallback p/ próximo dia permitido) e a capacidade diária (`maxPerDay`) é restrição branda com garantia de data. `registerReview`/`registerFixacao`/`rescheduleByRoutine` precisam de `routine` e `allowedDays` nas deps/refs (bug #21).
- `registerFixacao` zera FSRS (1ª revisão); `registerReview` usa o estado atual; `revertStage` penaliza a stability em 30%.
- Estado FSRS faz round-trip pelo backend (`SubjectDto`) — nunca remover campos do DTO ou toda revisão vira "primeira".

Ao terminar, se a mudança alterar comportamento/decisão, aplique o "Roteiro de manutenção" de `AGENTS.md`.
