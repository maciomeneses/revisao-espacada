---
name: nova-migration-flyway
description: Cria uma nova migration SQL do Flyway seguindo as convenções do Ebbing.
---

# Nova migration Flyway

Skill neutra (qualquer ferramenta). Fonte canônica: `docs/conventions/database.md`; runbook: `docs/runbooks/nova-migration-flyway.md`.

## Passos

1. Confirme o próximo número: rode `ls backend/src/main/resources/db/migration/`, pegue o maior `V{n}` e use `V{n+1}`.
2. Crie `backend/src/main/resources/db/migration/V{n+1}__descricao_em_snake_case.sql`.
3. DDL idempotente quando possível; prefira backward-compatible (expand → migrate → contract).
4. **Nunca** edite migrations já mergeadas em `main`.
5. Se a mudança vem de `model/`, ajuste/adicione testes do modelo/repository (cobertura — `docs/conventions/testing.md`).
6. Rode `cd backend && ./gradlew build` e siga o Roteiro de manutenção (`AGENTS.md`).
