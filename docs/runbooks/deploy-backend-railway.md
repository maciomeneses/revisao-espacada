# Runbook — Deploy do backend (Railway)

## Fluxo

- CI (`.github/workflows/ci-backend.yml`) roda em push/PR tocando `backend/**`, em **Java 21**: `./gradlew build` (compila + testes + JaCoCo). Artefato JAR é gerado.
- O Railway roda o JAR Spring Boot no profile `prod` (Flyway aplica migrations pendentes).

## Pré-requisitos

- Variáveis de ambiente de produção no Railway: ver `docs/conventions/backend-java.md` (`PG*`, `JWT_*`, `ADMIN_*`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `PORT`, `RATE_LIMIT_*`).
- `ProductionConfigValidator` falha o boot se faltar var obrigatória.

## Rate limit atrás do proxy do Railway (AÇÃO PENDENTE)

O tráfego HTTP chega ao container via **proxy de borda do Railway**. Sem configuração,
`EndpointRateLimitFilter` usa `request.getRemoteAddr()` — que aponta para o **proxy**, não
o cliente. Consequência: **todos os usuários compartilham o mesmo bucket** por endpoint
(ex.: login 5/min global). Um único ator satura o limite e nega login a todos; e o
brute-force fica limitado globalmente em vez de por origem.

O filtro só respeita `X-Forwarded-For` quando `remoteAddr` está em
`RATE_LIMIT_TRUSTED_PROXIES` (postura segura por padrão — ver `docs/conventions/security.md`).
Hoje essa variável **não está definida** no Railway.

Remediação (decisão pendente — requer o IP/faixa do proxy interno do Railway):

1. Descobrir o `remoteAddr` que o app enxerga (logar `request.getRemoteAddr()` uma vez,
   ou inspecionar o range da rede privada do Railway).
2. Definir `RATE_LIMIT_TRUSTED_PROXIES` com esse IP/faixa. Só então o XFF passa a valer e o
   rate limit volta a ser por cliente.

> **Nunca** usar curinga/`0.0.0.0` em `RATE_LIMIT_TRUSTED_PROXIES`: confiar em qualquer origem
> permite forjar o `X-Forwarded-For` e burlar o rate limit por completo.

Observação: o serviço roda hoje **sem** `SPRING_PROFILES_ACTIVE=prod` (perfil default,
`ddl-auto=update`, Flyway desligado) — consistente com a estratégia de baseline V15
documentada em `docs/conventions/database.md`. Ativar o profile `prod` é pré-requisito para
o Flyway assumir as migrations V16+.

## Migrations

- Flyway roda no profile `prod`. Confirme que a nova migration está presente e é imutável. Ver `docs/runbooks/nova-migration-flyway.md`.

## Validação pós-deploy

- Health check via Actuator.
- Testar um endpoint protegido (`Authorization: Bearer`) e o CORS a partir do domínio do frontend.

## Rollback

Ver `docs/runbooks/rollback.md`.
