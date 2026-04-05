# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Revisão Espaçada** — plataforma de revisão espaçada para o ENEM. Monorepo: React/TypeScript frontend (GitHub Pages) + Spring Boot backend (Railway).

## Commands

### Monorepo (root)
```bash
npm run dev              # Start frontend dev server
npm run build            # Build frontend
npm run test             # Run frontend tests
npm run deploy           # Deploy frontend to GitHub Pages
npm run backend:build    # ./gradlew build
npm run backend:run      # ./gradlew bootRun (port 8080)
npm run backend:test     # ./gradlew test
```

### Frontend (`cd frontend`)
```bash
npm run dev              # Vite dev server on port 5173
npm run build            # TypeScript check + Vite build
npm run test             # Vitest single run
npm run test:watch       # Vitest watch mode
```

### Backend (`cd backend`)
```bash
./gradlew build          # Build + run all tests + JaCoCo coverage check
./gradlew bootRun        # Run Spring Boot app
./gradlew test --tests "com.ebbin.api.SomeTest"  # Run single test
./gradlew dependencyCheckAnalyze  # OWASP CVE scan
```

## Architecture

**Frontend**: React 19 + TypeScript + Vite 7, Tailwind CSS 4, React Router v7, Recharts 3, Vitest
- Key files: `src/hooks/useSubjects.ts` (state + FSRS sync), `src/services/api.ts` (REST client), `src/services/algorithm.ts` (FSRS v6), `src/App.tsx` (routes)
- Tests: `frontend/tests/` (not co-located) | Session: `localStorage['ebbing_session'] = { email, token, role, timestamp }`

**Backend**: Spring Boot 4.0.3, Java 25, PostgreSQL + Flyway (prod only), JWT stateless, Bucket4j rate limiting, Caffeine cache
- Packages: `controller/`, `service/`, `model/`, `security/`, `config/`, `repository/`, `dto/`
- JaCoCo: 90% instruction / 85% branch / 90% line (enforced on `./gradlew build`)

**Data model**: `Subject` (clientId, modulo, area, aulaPrincipal, relevancia + FSRS fields), `ReviewStage` (aula/Learning/Review/Relearning/New), `PerformanceLevel` (nao_classificada/ruim/medio/bom/excelente)

## Environment Variables

**Frontend** (`frontend/.env`): `VITE_API_URL=http://localhost:8080`

**Backend**: `PGHOST/PORT/DATABASE/USER/PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `ADMIN_EMAIL/PASSWORD`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `PORT`, `RATE_LIMIT_*`

## CI/CD

- **Backend CI** (`.github/workflows/ci-backend.yml`): push/PR to `backend/**`, Java 21 (Java 25 só local)
- **Frontend Deploy** (`.github/workflows/deploy-frontend.yml`): push to `main` touching `frontend/**`, injeta `VITE_API_URL` do GitHub secret, deploys via `gh-pages`

## Rules

### Flyway Migrations
- **Nunca modificar** migrations V1–V6 — já rodaram em produção
- Próxima migration: `V7__descricao_em_snake_case.sql`
- Mudança em `backend/src/main/java/com/ebbin/api/model/` → migration obrigatória

### Cobertura JaCoCo (Backend)
- Toda nova classe backend precisa de testes antes de commitar
- Thresholds: **90% instruction, 85% branch, 90% line** — `./gradlew build` falha se não atingir
- Classes excluídas do JaCoCo: `EbbinApplication`, `AdminInitializer`, `CacheConfig`

### Algoritmo FSRS (`frontend/src/services/algorithm.ts`)
- Mudanças em `DEFAULT_W` afetam todos os usuários — documentar impacto antes de alterar
- `w[17] = 0.0` é **intencional** (dificuldade congelada) — não "corrigir"
- Datas: fuso **local** (`YYYY-MM-DD`), nunca UTC — comparações são string-based

### Contratos de API
- Erros: RFC 9457 ProblemDetail com campo `detail` (não `message`)
- Frontend usa `clientId` para subjects; `id` (PK do banco) não é exposto ao frontend

### Frontend
- Tailwind CSS 4 via plugin Vite — **não criar `tailwind.config.js`**
- `vite.config.ts` sem `base` — não adicionar sem ajustar o workflow de deploy
- Não alterar o formato do `ebbing_session` sem atualizar `api.ts`

### Fluxo de trabalho
- Após cada alteração feita pelo Claude, **sempre** fazer commit e push
- Nunca mencionar Claude, Claude Code ou Anthropic na mensagem de commit
- Usar Conventional Commits: `feat:`, `fix:`, `test:`, `chore:`, `refactor:`
