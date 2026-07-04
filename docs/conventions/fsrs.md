# Convenção — Algoritmo FSRS v6

> **Fonte canônica.** Verdade única para o algoritmo de revisão espaçada. Implementação em `frontend/src/services/algorithm.ts`; agendamento por rotina/preferências em `frontend/src/hooks/useSubjects.ts`.

## Parâmetros (`DEFAULT_W`) — congelados

`DEFAULT_W` afeta **todos os usuários**. Qualquer alteração exige análise documentada do impacto no intervalo médio de revisão (ver ADR-0002).

```
w[0..3] = S0 por rating (1=Again,2=Hard,3=Good,4=Easy): [0.4025, 0.8935, 2.1812, 4.1256]
w[4]    = D0 base: 4.8228          w[5]  = D0 scaling por rating: 0.7428
w[8]    = stability update: 1.4505 w[9]  = stability power: 0.1490
w[10]   = retrievability factor: 1.0151
w[11..14] = forgetting (2.0, 0.06, 0.32, 1.3)
w[15]   = hard penalty: 0.42       w[16] = easy bonus: 2.26
w[17]   = difficulty decay: 0.0    (INTENCIONAL — congela dificuldade após init; NÃO "corrigir")
REQUEST_RETENTION = 0.9   DECAY = -0.5   FACTOR ≈ 0.11111
```

## Mapeamento numCorrect → Rating → Performance

| numCorrect | Rating    | Performance |
| ---------- | --------- | ----------- |
| 0–4        | 1 (Again) | ruim        |
| 5–6        | 2 (Hard)  | medio       |
| 7–8        | 3 (Good)  | bom         |
| 9–10       | 4 (Easy)  | excelente   |

Mudar esse mapeamento afeta a taxa de retenção de todos os usuários.

## Datas — fuso LOCAL, nunca UTC

- `localDateStr`/`addDays`/`today` produzem **`YYYY-MM-DD`** em fuso local do navegador.
- `getFormulaStatus` compara datas como **string** (`<`, `===`) → `'Atrasado' | 'Hoje' | 'No Prazo' | ''`. Datas ISO com horário **quebram** a comparação.
- `scheduledDays = max(1, round(stability))` — nunca remover o `max(1, ...)`.

## Estados do ciclo

`aula` (inicial) → `Learning` (1ª revisão) → `Review` (ratings 2–4) / `Relearning` (rating 1) · `New` (não inicializado no banco).

## Agendamento com rotina e preferências

A data crua do FSRS é ajustada por **`snapReviewDate(fsrsDate, area, routine, allowedDays?, opts?)`** (em `useSubjects.ts`):

1. **`allowedDays`** (`useReviewPreferences` ← `user_preferences.allowed_review_days`) é **restrição forte**: a data final **nunca** pode cair fora de `allowedReviewDays`.
2. **`routine`** (`useRoutine` ← `routine_slot`) é **preferência**: tenta um dia em que o usuário estuda a `area`; sem dia compatível no horizonte, faz fallback para o próximo dia permitido.
3. **Capacidade diária** (`opts.maxPerDay` ← `user_preferences.max_reviews_per_day`, `opts.dayLoad` construído por `buildDayLoad`) é **restrição branda com garantia de data**: dia lotado é pulado para o próximo dia permitido com vaga; se **todo** o horizonte de 21 dias estiver lotado, escolhe o dia permitido **menos carregado** (empate = mais cedo). `null`/ausente = sem limite (comportamento legado). A capacidade **nunca** antecipa a data para antes da data FSRS e **nunca** viola `allowedDays`. Callers que reagendam em lote (efeito de re-snap, `rescheduleByRoutine`) usam mapa de carga **incremental**: removem o subject da própria data antes de snapar e o recolocam na data resultante — ordem determinística garante convergência.

`findNextRoutineDate` é **alias retrocompatível** — código novo usa `snapReviewDate`. `registerReview`, `registerFixacao` e `rescheduleByRoutine` precisam receber `routine` e `allowedDays` via deps/refs (ver `frontend-react.md`, bug #21).

## Funções de registro

- `registerFixacao`: zera `reps`/`stability`/`difficulty` antes de calcular (trata como 1ª revisão; fixação pós-aula nas primeiras 24h).
- `registerReview`: usa o estado FSRS atual (revisões subsequentes).
- `revertStage`: penaliza stability em 30% (`stability * 0.7`) — "esquecimento parcial".

## O que validar em mudanças

1. Alteração em `DEFAULT_W` → análise de impacto no intervalo médio (+ ADR).
2. Mudança em `numCorrect → rating` → impacto na retenção global.
3. Não converter datas para UTC.
4. Não remover `max(1, ...)` em `scheduledDays`.
5. Novo parâmetro `w` → documentar índice e significado.
6. `snapReviewDate` deve manter `allowedDays` como restrição forte e `routine` como preferência (fallback). Garantir deps/refs corretas.
7. Mudança na capacidade diária: garantir que sem limite (`maxPerDay` null/0) o comportamento é byte-a-byte o legado, que nenhum subject fica sem data e que `allowedDays` continua inviolável no desempate.
