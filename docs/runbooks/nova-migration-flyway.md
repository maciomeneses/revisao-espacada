# Runbook — Nova migration Flyway

## Quando

Sempre que uma mudança em `backend/src/main/java/com/ebbin/api/model/` alterar o schema. Migration vai na **mesma PR** da mudança de modelo.

## Passos

1. Identifique o próximo número: rode `ls backend/src/main/resources/db/migration/`, pegue o maior `V{n}` e use `V{n+1}` (ver `docs/conventions/database.md`).
2. Crie `backend/src/main/resources/db/migration/V{n+1}__descricao_em_snake_case.sql`.
3. Escreva DDL idempotente quando possível; prefira mudanças backward-compatible (expand → migrate → contract).
4. **Nunca** edite migrations já mergeadas em `main`.
5. Adicione/ajuste testes do modelo/repository afetado (cobertura — `testing.md`).

## Verificação

- Em dev o schema é via `ddl-auto`; Flyway roda só no profile `prod`. Para validar a migration, suba o backend com profile `prod` apontando para um Postgres descartável e confira que aplica sem erro.
- `./gradlew build` precisa passar (compila + testes + cobertura).
