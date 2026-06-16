# Runbook — Deploy do backend (Railway)

## Fluxo

- CI (`.github/workflows/ci-backend.yml`) roda em push/PR tocando `backend/**`, em **Java 21**: `./gradlew build` (compila + testes + JaCoCo). Artefato JAR é gerado.
- O Railway roda o JAR Spring Boot no profile `prod` (Flyway aplica migrations pendentes).

## Pré-requisitos

- Variáveis de ambiente de produção no Railway: ver `docs/conventions/backend-java.md` (`PG*`, `JWT_*`, `ADMIN_*`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `PORT`, `RATE_LIMIT_*`).
- `ProductionConfigValidator` falha o boot se faltar var obrigatória.

## Migrations

- Flyway roda no profile `prod`. Confirme que a nova migration (`V13+`) está presente e é imutável. Ver `docs/runbooks/nova-migration-flyway.md`.

## Validação pós-deploy

- Health check via Actuator.
- Testar um endpoint protegido (`Authorization: Bearer`) e o CORS a partir do domínio do frontend.

## Rollback

Ver `docs/runbooks/rollback.md`.
