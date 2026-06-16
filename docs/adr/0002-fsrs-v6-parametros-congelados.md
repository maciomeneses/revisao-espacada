# 0002 — FSRS v6 com parâmetros congelados

- Status: aceito
- Data: 2026-06-16

## Contexto

O agendamento de revisões usa o algoritmo FSRS v6 (`frontend/src/services/algorithm.ts`). Os pesos `DEFAULT_W` afetam todos os usuários.

## Decisão

Adotar FSRS v6 com `DEFAULT_W` fixos e **`w[17] = 0.0`** (decaimento de dificuldade desligado): a dificuldade não muda após a inicialização. É uma simplificação **intencional**, não um bug.

## Consequências

- Comportamento previsível; dificuldade estável por subject.
- Qualquer alteração em `DEFAULT_W` ou no mapeamento `numCorrect → rating` exige análise documentada do impacto no intervalo médio de revisão.
- Datas sempre em fuso **local** (`YYYY-MM-DD`), comparadas como string — nunca UTC.
- Pergunta em aberto: ativar dificuldade dinâmica (`w[17] != 0`). Ver `docs/conventions/fsrs.md`.
