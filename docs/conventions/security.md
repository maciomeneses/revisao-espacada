# Convenção — Segurança

> **Fonte canônica.** Verdade única para autenticação, autorização, rate limit e dependências.

## Autenticação (JWT)

- JWT **stateless** via JJWT 0.12.6. `JwtAuthenticationFilter` valida `Authorization: Bearer {token}` em cada request.
- Segredo em `JWT_SECRET`; expiração em `JWT_EXPIRATION_MS`. **Nunca** hardcodar — só via env.

## Auto-cadastro e verificação de e-mail (issue #59)

- `POST /api/auth/signup` (público, rate limited): cria conta `USER` com `email_verified=false` e envia link de confirmação (`FRONTEND_URL/?verify=<token>`, TTL 24h, uso único — tabela `email_verification_tokens`, V14). O papel **nunca** vem do payload.
- **Anti user-enumeration (OWASP A07)**: resposta sempre 202 idêntica — e-mail novo cria conta; não verificado reenvia link; já verificado não faz nada. Mensagens de erro de token são genéricas (não revelam se inexistente/expirado/usado).
- Conta não verificada **não autentica**: `UserDetails.enabled=false` → `DisabledException` → 403 `urn:problem:email-not-verified`. Contas criadas por ADMIN nascem verificadas.
- `POST /api/auth/verify-email` confirma o token e retorna sessão (auto-login). Token inválido → 409.
- Senha de signup: mínimo 8 caracteres com letra e número (`SignupRequest`); o client replica a regra.
- Kill switch: `SIGNUP_ENABLED=false` volta ao modo fechado (403 no signup; `/register` ADMIN inalterado).
- Higiene: `TokenCleanupService` purga tokens expirados/usados e contas nunca confirmadas após `SIGNUP_UNVERIFIED_TTL_HOURS` (padrão 48h).

## Autorização

- Endpoints públicos: `/api/auth/**`. Resto exige autenticação.
- `/api/admin/**` exige role `ADMIN` (`hasRole('ADMIN')` no `SecurityConfig`).
- Dono dos dados sempre resolvido via `Authentication.getName()` (ver `backend-java.md`). Nunca confiar em parâmetro/body para identificar o usuário.
- Todo endpoint novo precisa ter a configuração de segurança correta no `SecurityConfig` — endpoint novo sem regra de segurança é red flag.

## CORS

- Configurado em `CorsConfig`, origens em `CORS_ALLOWED_ORIGINS`. Qualquer header customizado ou método não-padrão precisa ser adicionado ali.

## Rate limiting

- `EndpointRateLimitFilter` (Bucket4j) aplica limites **por IP** via `RateLimitProperties` (env `RATE_LIMIT_*`). Buckets em cache Caffeine.
- Endpoints públicos (especialmente `/api/auth/**`) devem estar cobertos pelo rate limiter. Cobertos hoje: `login`, `forgot-password`, `reset-password`, `signup` (3/10min), `verify-email` (5/15min).

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
