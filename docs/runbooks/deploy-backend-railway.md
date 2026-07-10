# Runbook — Deploy do backend (Railway)

## Fluxo

- CI (`.github/workflows/ci-backend.yml`) roda em push/PR tocando `backend/**`, em **Java 21**: `./gradlew build` (compila + testes + JaCoCo). Artefato JAR é gerado.
- O Railway roda o JAR Spring Boot no profile `prod` (Flyway aplica migrations pendentes).

## Pré-requisitos

- Variáveis de ambiente de produção no Railway: ver `docs/conventions/backend-java.md` (`PG*`, `JWT_*`, `ADMIN_*`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `PORT`, `RATE_LIMIT_*`).
- `ProductionConfigValidator` falha o boot se faltar var obrigatória.

## Rate limit atrás do proxy do Railway

O tráfego HTTP chega ao container via **proxy de borda do Railway**. Sem configuração,
`EndpointRateLimitFilter` usa `request.getRemoteAddr()` — que aponta para o **proxy**, não
o cliente. Consequência: **todos os usuários compartilham o mesmo bucket** por endpoint
(ex.: login 5/min global). Um único ator satura o limite e nega login a todos; e o
brute-force fica limitado globalmente em vez de por origem.

**Solução (1 variável): `RATE_LIMIT_FORWARDED_FOR_TRUSTED_HOPS=1`.**

O filtro passa a pegar o IP que o proxy de borda **anexou** ao `X-Forwarded-For` (o
`hops`-ésimo a contar da direita). Como o Railway expõe exatamente 1 proxy, `hops=1`.
Esse IP **não é forjável** pelo cliente — qualquer `X-Forwarded-For` que ele envie fica à
esquerda do IP real anexado pela borda (ver `docs/conventions/security.md`).

Passo a passo:

```bash
# na dashboard do Railway (serviço backend) OU via CLI:
railway variables --set RATE_LIMIT_FORWARDED_FOR_TRUSTED_HOPS=1
# isso dispara um redeploy. O padrão é 0 (desligado) — nada muda até definir.
```

Verificação (opcional, recomendada uma vez): com o serviço em perfil default (logs
`com.ebbin` em DEBUG), faça **uma** tentativa de login e confira nos `railway logs` a linha
`Rate limit — IP do cliente via 1 hop(s) confiável(is): <IP> (XFF=...)`. Se `<IP>` for o seu
IP público externo (não um IP interno `10.x`/`100.x`), está correto. Se aparecer um IP
interno, aumente `hops` (raro — só se houver mais de um proxy na frente).

> **Nunca** usar o caminho legado `RATE_LIMIT_TRUSTED_PROXIES` com curinga: ele lê o IP mais
> à **esquerda** do `X-Forwarded-For`, que o cliente forja. Prefira sempre `*_TRUSTED_HOPS`.

## Profile de produção (`prod`) — ainda inativo

O serviço roda hoje **sem** `SPRING_PROFILES_ACTIVE=prod` (perfil default, `ddl-auto=update`,
Flyway desligado) — consistente com a estratégia de baseline V15 documentada em
`docs/conventions/database.md`. Ativar o profile `prod` faz o Hibernate passar a **validar**
o schema (em vez de atualizar) e o Flyway assumir as migrations **V16+**. Pré-requisito: o
schema atual já precisa conter as colunas de V14 (`email_verified`) e V15 (estado FSRS) — o
que já é verdade, pois o `ddl-auto=update` as criou. Mudança de deploy a fazer com cuidado
(ver `docs/conventions/database.md`).

## Migrations

- Flyway roda no profile `prod`. Confirme que a nova migration está presente e é imutável. Ver `docs/runbooks/nova-migration-flyway.md`.

## Validação pós-deploy

- Health check via Actuator.
- Testar um endpoint protegido (`Authorization: Bearer`) e o CORS a partir do domínio do frontend.

## Rollback

Ver `docs/runbooks/rollback.md`.
