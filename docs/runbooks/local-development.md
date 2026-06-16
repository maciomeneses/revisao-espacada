# Runbook — Desenvolvimento local

## Pré-requisitos

- Node 22+ (frontend), Java 25 (backend, build local), PostgreSQL para o backend em modo `prod`-like (opcional; em dev o schema é via `ddl-auto`).

## Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Crie `frontend/.env`:

```
VITE_API_URL=http://localhost:8080
```

## Backend

```bash
cd backend
./gradlew bootRun    # http://localhost:8080
```

Variáveis necessárias (ver `docs/conventions/backend-java.md`): `PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `ADMIN_EMAIL/PASSWORD`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `PORT`, `RATE_LIMIT_*`.

## Tudo pela raiz

```bash
npm run dev          # frontend
npm run backend:run  # backend
npm run test         # testes frontend
npm run backend:test # testes backend
```

## Antes de commitar

```bash
npm run format:check && npm run lint           # formatação + lint frontend
cd frontend && npm run test:coverage           # cobertura per-file
cd backend && ./gradlew jacocoTestCoverageVerification
```
