# Convenção — Frontend React / TypeScript

> **Fonte canônica.** Verdade única para o frontend. Adaptadores apenas apontam para cá.

## Stack e versões exatas

- React **19** + TypeScript **5.5** + Vite **7**.
- **Tailwind CSS 4** via `@tailwindcss/vite` — **sem `tailwind.config.js`**.
- React Router **v7** (`react-router-dom ^7.14`).
- Recharts 3 (gráficos), Lucide React (ícones).
- Vitest 4 (jsdom) — ver `testing.md`.

## Build e deploy

- `vite.config.ts` **sem `base`** (usa `/`). O deploy via `gh-pages` publica em `https://{user}.github.io/revisao-espacada/`. **Não adicionar `base` sem ajustar o workflow de deploy.**
- Build: `tsc -b && vite build`. Erro de `tsc` quebra o deploy.

## Rotas

```
/             LandingPage (pública)
/login        AuthScreen (redireciona p/ /dashboard se autenticado)
/dashboard    Dashboard (protegida)
/cronograma   Cronograma (protegida)
/espiao       EspiaoEstrategico (protegida)
/admin        AdminArea (protegida, requer role === 'ADMIN')
```

Rotas protegidas: `<Navigate to="/login" replace />` quando `!isAuthenticated`. Rotas admin: `<Navigate to="/dashboard" replace />` quando não-ADMIN. Navegar sempre via `useNavigate()`, nunca `window.location.href`.

## Autenticação e sessão

- Sessão em `localStorage`, chave **`ebbing_session`**.
- Formato: `{ email: string, token: string, role: 'USER' | 'ADMIN', timestamp: number }`.
- Token no header `Authorization: Bearer {token}`.
- Leitura via `getToken()` de `api.ts`, **nunca** ler `ebbing_session` direto em componentes.
- 401 fora de `/api/auth/` → remove sessão e recarrega.
- **Não alterar o formato do `ebbing_session` sem atualizar `api.ts`.**
- Logout: remove sessão, navega para `/`, e chama `clearRoutine()` (de `useRoutine`) + `clearSubjects()` (de `useSubjects`) para invalidar o cache local do usuário anterior.

## API client (`src/services/api.ts`)

`api.auth.{login,forgotPassword,resetPassword}`, `api.subjects.{list,sync,upsert,delete}`, `api.reviewEvents.{list,create}`, `api.admin.users.{list,create,update,delete}`. Erros lançados como `Error` com `detail` (RFC 9457) ou `message`.

## Estado e hooks

- **Não usar Context API para estado de subjects** — o hook `useSubjects` é a solução.
- `useSubjects(routine, userEmail, allowedDays)` gerencia FSRS + sync. Usa `subjectsRef` para callbacks estáveis: **nunca** adicione `subjects` na dep array dos `useCallback`; leia via `subjectsRef.current`.
- **Bug do ticket #21 não pode repetir**: callbacks que dependem de `routine`/`allowedDays` (`registerReview`, `registerFixacao`, `rescheduleByRoutine`) **precisam** incluir `routine` e `allowedDays` nas dep arrays, senão o agendamento ignora alterações de preferência.
- `useRoutine` e `useReviewPreferences`: backend autoritativo + cache otimista por `userEmail`.
- Agendamento FSRS é ajustado por `snapReviewDate` — ver `fsrs.md`.

## Tipagem

- Sem `any`. Props de componentes sempre tipadas. Tipos centrais em `src/types.ts` (`Subject`, `ReviewStage`, `Performance`, `PerformanceLevel`, `Role`).

## Restrições absolutas (NUNCA)

- Criar `tailwind.config.js`.
- Adicionar `base` ao `vite.config.ts` sem ajustar deploy.
- Context API para estado de subjects.
- Mudar formato de `ebbing_session` sem atualizar `api.ts`.
- `window.location.href` para navegação (use `useNavigate`).
- Componente novo sem teste cobrindo ≥90% — ver `testing.md`.
