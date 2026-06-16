# 0007 — `clientId` vs PK do banco no frontend

- Status: aceito
- Data: 2026-06-16

## Contexto

Subjects são criados offline-first no frontend e sincronizados com o backend.

## Decisão

O frontend gera e conhece apenas o **`clientId`** (string). A PK do banco (`Long id`) **não é exposta** ao frontend. O backend mantém unique `(user_id, client_id)` para o sync.

## Consequências

- Sync idempotente por `clientId`.
- Código backend não deve confundir `id` (PK) com `clientId`. Endpoints e DTOs operam com `clientId` no contrato externo.
- Registrado em `docs/conventions/backend-java.md` e `frontend-react.md`.
