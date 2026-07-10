# GitHub Copilot — Ebbing (Revisão Espaçada)

> **Adaptador.** A fonte canônica neutra é `AGENTS.md` (raiz); as regras técnicas vivem em `docs/conventions/`. Este arquivo não contém regra exclusiva.

## Contexto

Monorepo: `frontend/` (React 19 + Vite 7 + Tailwind 4 → Vercel; produção em `https://www.ebbing.com.br`) e `backend/` (Spring Boot 4 + Java 25 + PostgreSQL → Railway), independentes.

## Antes de sugerir código, siga

- `docs/conventions/backend-java.md`, `frontend-react.md`, `database.md`, `security.md`, `testing.md`, `fsrs.md`, `gitflow.md`.

## Regras que mais impactam sugestões

- Sem `any` (TS); injeção por construtor (Java, sem `@Autowired` em field); DTOs em vez de entidades JPA.
- Erros via RFC 9457 ProblemDetail (campo `detail`).
- Migrations Flyway imutáveis; mudança em `model/` exige nova migration (próximo número via `database.md`).
- Tailwind 4 sem `tailwind.config.js`; estado de subjects via `useSubjects` (não Context API).
- Cobertura obrigatória (JaCoCo 90/85/90 agregado E per-class; Vitest per-file 90/90/85/90).
- Conventional Commits; **nunca** citar IA em commit ou `Co-Authored-By`.
