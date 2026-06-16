# 0005 — Cobertura de testes agressiva (JaCoCo + Vitest)

- Status: aceito
- Data: 2026-06-16

## Contexto

A lógica de FSRS e de agendamento é sensível; regressões silenciosas são caras.

## Decisão

Impor cobertura alta e bloqueante:

- **Backend (JaCoCo 0.8.14):** 90% instruction / 85% branch / 90% line, **agregado E per-class** (duas `violationRules` em `build.gradle`). `./gradlew build` falha se qualquer classe nova nascer abaixo. Exclusões de infraestrutura: `EbbinApplication`, `AdminInitializer`, `CacheConfig`.
- **Frontend (Vitest v8):** thresholds **per-file** 90/90/85/90. `npm run test:coverage` falha o CI de deploy. Exclusões: `*.d.ts`, `main.tsx`, `vite-env.d.ts`, `types.ts`.

## Consequências

- Código novo de produção exige teste na mesma PR.
- Reduzir thresholds ou excluir arquivos exige justificativa explícita.
- Detalhe operacional em `docs/conventions/testing.md`.
