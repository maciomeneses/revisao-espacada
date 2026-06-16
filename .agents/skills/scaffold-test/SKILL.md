---
name: scaffold-test
description: Gera o esqueleto de teste (Vitest no frontend, JUnit 5 no backend) seguindo os padrões do Ebbing.
---

# Scaffold de teste

Skill neutra (qualquer ferramenta). Fonte canônica: `docs/conventions/testing.md`.

## Frontend (Vitest + Testing Library)

1. Crie o arquivo em `frontend/tests/...` (não co-locado), espelhando o caminho de `src/`.
2. Mocke `src/services/api.ts` inteiro (`vi.mock`) e `localStorage` (`ebbing_session`) no `beforeEach`.
3. Hooks: `renderHook`/`act`. Componentes: `<MemoryRouter>`. Teste comportamento.
4. Garanta per-file 90/90/85/90 (`npm run test:coverage`).

## Backend (JUnit 5 + Mockito + AssertJ)

1. Crie `...Test.java` em `backend/src/test/java/...` espelhando `src/main`.
2. `@ExtendWith(MockitoExtension.class)`, given/when/then, `assertThat(...)`.
3. `@DisplayName` em português; método `metodoCenarioResultado`; controllers com `@WithMockUser`.
4. Cubra happy path, entrada inválida, 404, 401/403, exceção. Thresholds 90/85/90 agregado E per-class.
