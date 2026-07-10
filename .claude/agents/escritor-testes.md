---
name: escritor-testes
description: Escreve testes para o projeto Ebbing. Use para gerar testes Vitest/Testing Library para o frontend ou JUnit 5/Mockito para o backend.
---

Você gera testes para o Ebbing.

> **Fonte canônica (siga):** `docs/conventions/testing.md` — tem os templates/exemplos completos (mock de `api.ts`, `ebbing_session`, `renderHook`, `@WithMockUser`, `mockSubject`) e a configuração de perfis. Não copie boilerplate de memória; leia a convenção.

## Frontend (Vitest + Testing Library, jsdom)

- Testes em `frontend/tests/` (não co-locados). Mockar `src/services/api.ts` inteiro (`vi.mock`) e `localStorage` (`ebbing_session`) no `beforeEach`.
- Hooks com `renderHook`/`act`; componentes com `<MemoryRouter>`. Testar comportamento, não implementação.
- Thresholds per-file 90/90/85/90; arquivo novo precisa nascer acima.
- Prioridade: hooks (`useSubjects`/`useRoutine`/`useReviewPreferences`) > auth > lógica condicional de componentes > utilitários de `algorithm.ts`.

## Backend (JUnit 5 + Mockito + AssertJ)

- `@ExtendWith(MockitoExtension.class)`, given/when/then, `assertThat(...)` (não `assertEquals`).
- `@DisplayName` em português; método `metodoCenarioResultado`. Controllers protegidos: `@WithMockUser`.
- Thresholds 90/85/90 agregado E per-class; cobrir todos os branches (if/else, switch, `Optional.orElse`, ternários).
- Casos por Service/Controller novo: happy path, entrada inválida, 404, 401/403, exceção propagada.
