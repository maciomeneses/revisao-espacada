# Convenção — Backend Java / Spring Boot

> **Fonte canônica.** Esta é a verdade única para o backend. Adaptadores (`.claude/rules/backend-java.md`, `.cursor/rules/backend-java.mdc`) apenas apontam para cá.

## Stack e versões exatas

- Spring Boot **4.0.3**, **Java 25** (toolchain Gradle). CI roda em **Java 21** — ver `gitflow.md` / CI.
- Spring Data JPA + PostgreSQL (`org.postgresql:postgresql`).
- Spring Security + JWT via **JJWT 0.12.6**.
- Flyway (migrations só no profile `prod`) — ver `database.md`.
- **Bucket4j 8.10.1** (rate limit) + **Caffeine 3.1.8** (Spring Cache + eviction de buckets) — ver `security.md`.
- Spring Boot Actuator (health/métricas).
- JaCoCo 0.8.14 + OWASP Dependency-Check 12.1.1 — ver `testing.md` / `security.md`.

## Estrutura de pacotes (`com.ebbin.api`)

```
config/      SecurityConfig, CorsConfig, CacheConfig, RateLimitProperties, AppConfig, AdminInitializer, ProductionConfigValidator
controller/  AuthController, SubjectController, ReviewEventController, AdminUserController
dto/         LoginRequest, LoginResponse, RegisterRequest, SubjectDto, ReviewEventDto, UserDto, PasswordResetRequest, ResetPasswordRequest
exception/   handlers globais de erro
model/       Subject, User, ReviewEvent, PasswordResetToken, ReviewStage, PerformanceLevel (+ converters)
repository/  SubjectRepository, UserRepository, ReviewEventRepository, PasswordResetTokenRepository
security/    JwtAuthenticationFilter, EndpointRateLimitFilter, MdcRequestFilter, UserDetailsServiceImpl
service/     JwtService e demais services de negócio
```

## Regras de camada

- **Controllers**: orquestração + validação de entrada. Sem lógica de negócio.
- **Services**: lógica de negócio. `@Transactional` para writes.
- **DTOs**: nunca expor entidade JPA num controller — sempre DTO de request/response.
- **Repositories**: `JpaRepository`/interfaces. Relacionamentos JPA `LAZY` por padrão; `EAGER` exige justificativa.
- **Injeção por construtor** sempre. **Nunca** `@Autowired` em field.
- Nunca expor `password` em DTO de resposta.

## Erros de API — RFC 9457 ProblemDetail

O backend retorna **ProblemDetail** (RFC 9457). O campo de mensagem é **`detail`**, não `message`. Isso é crítico para o frontend, que faz `body.detail ?? body.message`. Toda violação de validação retorna `ProblemDetail` 400.

## Segurança (resumo; detalhe em `security.md`)

- JWT stateless: `JwtAuthenticationFilter` valida `Bearer {token}` por request.
- Públicos: `/api/auth/**` (login, forgot-password, reset-password). Resto exige autenticação.
- `/api/admin/**` exige role `ADMIN` (`hasRole('ADMIN')` no `SecurityConfig`).
- CORS via `CorsConfig` (origens em `CORS_ALLOWED_ORIGINS`).
- `spring.jpa.open-in-view=false`.

## Autorização por usuário

`/api/routine` e `/api/preferences` resolvem o dono via `Authentication.getName()`. **Nunca** confiar em parâmetro/body para identificar o dono — cada request só lê/escreve a própria rotina/preferências.

## Modelo de dados (resumo)

- `Subject`: PK `Long id` (auto); chave de sync `String clientId` (gerado no frontend). Unique `(user_id, client_id)`. `currentStage`/`performanceLevel`/`lastPerformance` persistidos como STRING. `@CreationTimestamp`/`@UpdateTimestamp`. Cascade delete em `user`.
- `ReviewStage` (enum): `aula`, `Learning`, `Review`, `Relearning`, `New`.
- `PerformanceLevel` (enum): `nao_classificada`, `ruim`, `medio`, `bom`, `excelente`.
- `RoutineSlot` (`routine_slot`): `user_id`, `day` 0..6, `slot_type` ∈ {`study`, `other`}, `area`/`label`. Validar `day` ∈ 0..6 e `slot_type` no enum.
- `UserPreferences` (`user_preferences`): `allowed_review_days SMALLINT[]` — cada dia ∈ 0..6 e o array **não pode ser vazio**; `max_reviews_per_day SMALLINT NULL` — teto de revisões agendáveis por dia (`null` = sem limite; quando definido, ≥ 1). O `PUT /api/preferences` substitui o recurso completo (dias + limite no mesmo payload).

## Variáveis de ambiente

```
PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
JWT_SECRET, JWT_EXPIRATION_MS
ADMIN_EMAIL, ADMIN_PASSWORD
CORS_ALLOWED_ORIGINS, FRONTEND_URL
PORT
RATE_LIMIT_* (parâmetros de rate limit)
```

`ProductionConfigValidator` garante que as vars obrigatórias existem no profile `prod`.

## Restrições absolutas (NUNCA)

- Expor entidade JPA em controller (sempre DTO).
- `@Autowired` em field (use construtor).
- Lógica de negócio em controller.
- `FetchType.EAGER` sem justificativa.
- Retornar `message` em vez de `detail` nos erros.
- Commitar secret/API key.
- Ignorar exceção silenciosamente.
- Cobertura abaixo da política — ver `testing.md`.
