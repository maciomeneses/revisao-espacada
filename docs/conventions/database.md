# Convenção — Banco de dados / Migrations Flyway

> **Fonte canônica.** Verdade única para schema e migrations.

## Flyway

- Migrations rodam **apenas no profile `prod`**. Em desenvolvimento, o schema é gerenciado por `spring.jpa.hibernate.ddl-auto`.
- Nomenclatura: **`V{N}__descricao_em_snake_case.sql`** em `backend/src/main/resources/db/migration/`.

### Baseline de produção (Railway) — V15

O banco de produção foi historicamente gerenciado por `ddl-auto=update` (profile default); **as migrations V1..V15 nunca rodaram lá** — o schema equivalente foi criado pelo Hibernate. O profile `prod` usa `baseline-version: 15` (`application-prod.yml`): o Flyway registra o banco existente como "já na V15" e só aplica **V16+**.

Consequências para autores de migrations:

- **Não assumir efeitos colaterais de V1..V15 em produção** que o `ddl-auto` não replica: índices manuais (V4), CHECK constraints (V2, V11, V13) e backfills (V10) **não existem** no banco do Railway. Se algum for necessário, criar migration V16+ idempotente (`IF NOT EXISTS` / guards).
- **Nunca reduzir o `baseline-version`**: reaplicar V1..V15 num schema populado quebraria.
- Colunas `NOT NULL` novas em entidades precisam de `DEFAULT` no `columnDefinition` enquanto houver ambientes em `ddl-auto=update` (caso `email_verified`).

## Migrations existentes (NÃO modificar)

Já mergeadas em `main` (rodaram ou rodarão em produção) — são **imutáveis**:

- `V1__initial_schema.sql`
- `V2__constrain_last_performance.sql`
- `V3__password_reset_tokens.sql`
- `V4__performance_indexes.sql`
- `V5__review_events.sql`
- `V6__review_events_accuracy.sql`
- `V11__user_preferences.sql` (`user_preferences` com `allowed_review_days SMALLINT[]`)
- `V12__routine_slot.sql` (`routine_slot` para rotina semanal por usuário)
- `V13__user_preferences_max_reviews_per_day.sql` (`max_reviews_per_day SMALLINT NULL`, CHECK ≥ 1)
- `V14__signup_email_verification.sql` (`users.email_verified` + `email_verification_tokens`)
- `V15__subjects_fsrs_state.sql` (colunas FSRS em `subjects`: `stability`, `difficulty`, `reps`, `lapses`, `state`, `scheduled_days` — todas nullable)

**Próxima migration: `V16__...`.**

## Regras

- **Nunca** modificar uma migration já mergeada em `main`. Toda mudança de schema = **nova** migration `V{N+1}__...`.
- Qualquer mudança em `backend/src/main/java/com/ebbin/api/model/` que altere o schema **exige** migration correspondente na mesma PR.
- Avaliar se a migration é reversível ou se haverá downtime; preferir mudanças backward-compatible (expand → migrate → contract) quando aplicável.
- Tipos/constraints documentados no modelo (ver `backend-java.md`): `routine_slot` (`day` 0..6, `slot_type` ∈ {study, other}), `user_preferences.allowed_review_days` (cada dia 0..6, array não vazio), `user_preferences.max_reviews_per_day` (NULL = sem limite; quando definido, ≥ 1).

## Restrições absolutas (NUNCA)

- Editar migration existente em `main`.
- Mexer em `model/` que altere schema sem migration na mesma PR.
- Reutilizar um número de versão já existente.
