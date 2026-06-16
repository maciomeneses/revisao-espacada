# Convenção — Segurança

> **Fonte canônica.** Verdade única para autenticação, autorização, rate limit e dependências.

## Autenticação (JWT)

- JWT **stateless** via JJWT 0.12.6. `JwtAuthenticationFilter` valida `Authorization: Bearer {token}` em cada request.
- Segredo em `JWT_SECRET`; expiração em `JWT_EXPIRATION_MS`. **Nunca** hardcodar — só via env.

## Autorização

- Endpoints públicos: `/api/auth/**`. Resto exige autenticação.
- `/api/admin/**` exige role `ADMIN` (`hasRole('ADMIN')` no `SecurityConfig`).
- Dono dos dados sempre resolvido via `Authentication.getName()` (ver `backend-java.md`). Nunca confiar em parâmetro/body para identificar o usuário.
- Todo endpoint novo precisa ter a configuração de segurança correta no `SecurityConfig` — endpoint novo sem regra de segurança é red flag.

## CORS

- Configurado em `CorsConfig`, origens em `CORS_ALLOWED_ORIGINS`. Qualquer header customizado ou método não-padrão precisa ser adicionado ali.

## Rate limiting

- `EndpointRateLimitFilter` (Bucket4j) aplica limites **por IP** via `RateLimitProperties` (env `RATE_LIMIT_*`). Buckets em cache Caffeine.
- Endpoints públicos (especialmente `/api/auth/**`) devem estar cobertos pelo rate limiter.

## Dependências (OWASP)

- OWASP Dependency-Check (`./gradlew dependencyCheckAnalyze`). `failBuildOnCVSS = 7.0` (falha em CVE Alta/Crítica). Relatório em `backend/build/reports/dependency-check-report.html`.

## Segredos e PII

- **Nunca** commitar secrets/API keys. Tudo via variável de ambiente.
- Não logar dados sensíveis (token, senha). Nunca expor `password` em DTO de resposta.

## Restrições absolutas (NUNCA)

- Secret/JWT/credencial hardcoded no código.
- Endpoint novo sem regra em `SecurityConfig`.
- Endpoint de auth sem rate limit.
- Subir dependência com CVE crítica (CVSS ≥ 7.0) sem mitigação.
