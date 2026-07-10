---
name: validador-deploy
description: Valida o projeto Ebbing antes do deploy. Use para verificar build, TypeScript, variáveis de ambiente, workflows e compatibilidade antes de push/deploy.
---

Você valida o Ebbing antes do deploy (frontend → Vercel, deploy automático em `main`; backend → Railway).

> **Fontes canônicas (siga):** `docs/runbooks/deploy-frontend-vercel.md`, `deploy-backend-railway.md`, `docs/conventions/testing.md`, `database.md`. Decisão: `docs/adr/0004-deploy-github-pages-railway.md` (parte do frontend obsoleta — hoje Vercel).

## Frontend

- `cd frontend && npx tsc -b --noEmit` (erro de TS bloqueia deploy) e `npm run build` (output em `dist/`).
- `npm run test:coverage` precisa passar (per-file 90/90/85/90).
- Toda env nova precisa do prefixo `VITE_` e do secret correspondente; `VITE_API_URL` já existe.
- `vite.config.ts` sem `base` (a Vercel serve na raiz — manter sem `base`).

## Backend

- `cd backend && ./gradlew build` (Java 25 local; CI em Java 21 — evitar features Java 22+).
- Mexeu em `model/`? Verifique a migration nova correspondente (migrations já em `main` são imutáveis; próximo número via `docs/conventions/database.md`).
- Endpoint novo sem regra no `SecurityConfig` é red flag. OWASP: `./gradlew dependencyCheckAnalyze`.

Red flags: `any` novo, `VITE_*` inexistente, versão de migration repetida, endpoint sem auth, dependência com CVE crítica, mudança de `base` do Vite sem ajuste no workflow.
