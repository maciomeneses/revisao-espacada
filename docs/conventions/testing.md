# Convenção — Testes e Cobertura

> **Fonte canônica.** Verdade única para testes e thresholds de cobertura. **Política não negociável.**

## Princípio

Todo código de produção novo precisa de teste **na mesma PR**. Cobertura abaixo do threshold **quebra o build** (CI e local).

## Backend — JUnit 5 + Mockito + AssertJ

- `@ExtendWith(MockitoExtension.class)`, `@InjectMocks` + `@Mock`, blocos given/when/then.
- Asserções com **AssertJ** (`assertThat(...)`), não `assertEquals`.
- Nomenclatura: `@DisplayName` em português + método `metodoCenarioResultado` (camelCase).
- Controllers protegidos: `@WithMockUser(username=..., roles={"USER"|"ADMIN"})`.
- Casos sempre cobertos por Service/Controller novo: happy path, entrada inválida, 404, 401/403, exceção propagada.

### Thresholds JaCoCo (0.8.14) — agregado **E** per-class

- **90% instruction / 85% branch / 90% line.**
- Duas `violationRules` em `backend/build.gradle`: uma agregada (sem `element`) e uma com `element = 'CLASS'`. **Toda classe nova precisa nascer ≥ 90%** — `./gradlew build` falha se o agregado **ou qualquer classe** ficar abaixo.
- Exclusões de infraestrutura (sem lógica testável): `EbbinApplication`, `config/AdminInitializer`, `config/CacheConfig`. Repositórios JPA são interfaces puras (JaCoCo não emite counters) — não precisam de exclusão.
- Antes de commitar: `./gradlew jacocoTestCoverageVerification`.
- Cobrir **todos os branches** (if/else, switch, `Optional.orElse`, ternários) é obrigatório.

## Frontend — Vitest + Testing Library

- Ambiente `jsdom`, setup em `frontend/tests/setup.ts`. Testes em `frontend/tests/` (**não co-locados**).
- Mockar o módulo `src/services/api.ts` inteiro (`vi.mock`). Mockar `localStorage` (`ebbing_session`) no `beforeEach`.
- Hooks com `renderHook`/`act`; componentes com `<MemoryRouter>` (React Router v7).
- Testar **comportamento**, não implementação.

### Thresholds Vitest (provider v8) — **per-file**

- Config em `frontend/vitest.config.ts`: `perFile: true`, **90% lines / 90% functions / 85% branches / 90% statements**.
- `npm run test:coverage` falha se qualquer arquivo novo/modificado cair abaixo. Também usado no workflow `ci-frontend.yml`.
- Exclusões: `src/**/*.d.ts`, `src/main.tsx`, `src/vite-env.d.ts`, `src/types.ts` (declarações puras). Nova exclusão exige justificativa explícita.
- Antes de commitar componente novo: `cd frontend && npm run test:coverage`.

### Prioridade quando faltar cobertura

1. Lógica de hooks (`useSubjects`, `useRoutine`, `useReviewPreferences`).
2. Autenticação (`AuthScreen`, `ResetPasswordScreen`).
3. Lógica condicional em componentes (`Cronograma`, `Dashboard`, `RoutineBoard`).
4. Utilitários de `algorithm.ts` (cálculos FSRS, `snapReviewDate`, datas).

## Restrições absolutas (NUNCA)

- Código de produção novo sem teste na mesma PR.
- Remover/baixar thresholds de JaCoCo ou Vitest.
- Excluir arquivo da cobertura sem justificativa.
