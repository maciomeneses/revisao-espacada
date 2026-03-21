# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Revisão Espaçada** is a spaced repetition review platform focused on ENEM (Brazilian national exam). It's a monorepo with a React/TypeScript frontend (deployed to GitHub Pages) and a Spring Boot backend (deployed to Railway).

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
./gradlew build          # Build + run all tests
./gradlew bootRun        # Run Spring Boot app
./gradlew test           # Run JUnit tests
./gradlew test --tests "com.ebbin.api.SomeTest"  # Run single test
./gradlew dependencyCheckAnalyze  # OWASP CVE scan
```

## Architecture

### Frontend
- **Framework**: React 19 + TypeScript, built with Vite 7
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest + Testing Library
- **State**: React hooks + localStorage (JWT token, subject data)
- **Key hook**: `src/hooks/useSubjects.ts` — manages all FSRS state and sync logic
- **API client**: `src/services/api.ts` — REST client with `Bearer {token}` auth
- **FSRS algorithm**: `src/services/algorithm.ts` — FSRS v6 spaced repetition implementation
- **Routing**: View-based (no React Router) — `App.tsx` renders views based on state
- **Deploy base path**: `/revisao-espacada/` (configured in `vite.config.ts`)

### Backend
- **Framework**: Spring Boot 3.5.0, Java 25
- **Auth**: Stateless JWT (`JwtAuthenticationFilter`), JJWT 0.12.6
- **Database**: PostgreSQL + Spring Data JPA + Flyway migrations (prod only)
- **Caching**: Caffeine via Spring Cache (subjects list, rate-limit buckets)
- **Rate limiting**: Bucket4j via `EndpointRateLimitFilter`
- **3 REST controllers**: `AuthController`, `SubjectController`, `AdminUserController`
- **Coverage enforced**: JaCoCo — 90% instruction, 85% branch, 90% line

### Data Model
- **Subject**: modulo, area, aulaPrincipal, relevancia + FSRS fields (stability, difficulty, elapsedDays, scheduledDays, reps, lapses, reviewStage)
- **ReviewStage**: `aula`, `Learning`, `Review`, `Relearning`, `New`
- **Performance ratings**: `ruim`, `medio`, `bom`, `excelente`

## Environment Variables

### Frontend (`.env` file in `frontend/`)
```
VITE_API_URL=http://localhost:8080
```

### Backend
```
PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
JWT_SECRET, JWT_EXPIRATION_MS
ADMIN_EMAIL, ADMIN_PASSWORD
CORS_ALLOWED_ORIGINS, FRONTEND_URL
PORT
RATE_LIMIT_* (various rate limiting params)
```

## CI/CD

- **Backend CI** (`.github/workflows/ci-backend.yml`): runs on push/PR to `backend/**` using Java 21
- **Frontend Deploy** (`.github/workflows/deploy-frontend.yml`): runs on push to `main` touching `frontend/**`; injects `VITE_API_URL` from GitHub secret at build time, then deploys via `gh-pages`
