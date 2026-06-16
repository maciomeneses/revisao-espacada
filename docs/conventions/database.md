# Convenção — Banco de dados / Migrations Flyway

> **Fonte canônica.** Verdade única para schema e migrations.

## Flyway

- Migrations rodam **apenas no profile `prod`**. Em desenvolvimento, o schema é gerenciado por `spring.jpa.hibernate.ddl-auto`.
- Nomenclatura: **`V{N}__descricao_em_snake_case.sql`** em `backend/src/main/resources/db/migration/`.

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

**Próxima migration: `V13__...`.**

## Regras

- **Nunca** modificar uma migration já mergeada em `main`. Toda mudança de schema = **nova** migration `V{N+1}__...`.
- Qualquer mudança em `backend/src/main/java/com/ebbin/api/model/` que altere o schema **exige** migration correspondente na mesma PR.
- Avaliar se a migration é reversível ou se haverá downtime; preferir mudanças backward-compatible (expand → migrate → contract) quando aplicável.
- Tipos/constraints documentados no modelo (ver `backend-java.md`): `routine_slot` (`day` 0..6, `slot_type` ∈ {study, other}), `user_preferences.allowed_review_days` (cada dia 0..6, array não vazio).

## Restrições absolutas (NUNCA)

- Editar migration existente em `main`.
- Mexer em `model/` que altere schema sem migration na mesma PR.
- Reutilizar um número de versão já existente.
