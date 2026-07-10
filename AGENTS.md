# Revisão Espaçada (Ebbing) — Instruções para Agentes de IA

> **FONTE CANÔNICA NEUTRA.** Ponto de entrada para qualquer ferramenta de IA que segue o padrão `AGENTS.md` (OpenAI Codex CLI, Aider, etc.). Adaptadores específicos referenciam este arquivo:
>
> - `CLAUDE.md` (raiz) — Claude Code
> - `GEMINI.md` (raiz) — Gemini CLI / Google Antigravity
> - `.claude/rules/*.md` — Claude Code (regras com globs)
> - `.cursor/rules/*.mdc` — Cursor
> - `.github/copilot-instructions.md` — GitHub Copilot
> - `.codex/agents/*.toml` — agentes especializados para Codex
> - `.agents/skills/` — skills neutras reutilizáveis

---

## Contexto do projeto

**Ebbing** — plataforma de revisão espaçada (algoritmo FSRS v6) para o ENEM. Monorepo com frontend e backend **desacoplados** (sem código compartilhado):

- `frontend/` — React 19 + TypeScript + Vite 7 + Tailwind 4 → **sem deploy automatizado** (Pages desativado — ADR-0004 obsoleto; produção do Ebbing em `https://my.ebbin.app`, fora deste repo).
- `backend/` — Spring Boot 4 + Java 25 + PostgreSQL + Flyway → **Railway**.

**Documento mestre (visão completa):** `docs/analysis_results.md` — leia ao receber uma tarefa não-trivial.

## Playbook operacional

Em sessão fresca, leia **`docs/agent-playbook.md`** antes de qualquer mudança no código (Java 25 local vs Java 21 no CI, thresholds de cobertura, migrations Flyway, onde ficam os testes, quando usar subagente).

## Harness de IA agnóstico

O comportamento comum nasce em arquivos neutros: `AGENTS.md`, `docs/agent-playbook.md`, `docs/conventions/*.md` e `docs/analysis_results.md`. Os adaptadores (`CLAUDE.md`, `GEMINI.md`, `.claude/**`, `.cursor/**`, `.github/copilot-instructions.md`, `.codex/**`) só carregam, apontam ou espelham essas regras. **Nenhum adaptador contém regra técnica exclusiva.** O mapa do harness está em `docs/ai-harness.md` — leia antes de mexer em instruções de agentes, skills, hooks ou adaptadores.

## Convenções (FONTE ÚNICA — consulte antes de editar código)

- `docs/conventions/backend-java.md`
- `docs/conventions/frontend-react.md`
- `docs/conventions/database.md`
- `docs/conventions/security.md`
- `docs/conventions/testing.md`
- `docs/conventions/fsrs.md`
- `docs/conventions/gitflow.md`

---

## Roteiro de manutenção do documento (OBRIGATÓRIO)

Toda mudança de feature, decisão arquitetural, dependência ou processo dispara o roteiro abaixo, na **mesma PR**:

1. Atualizar `docs/analysis_results.md` (documento mestre).
2. Atualizar `AGENTS.md` se a mudança é global.
3. Atualizar `docs/conventions/*.md` (fonte única das regras).
4. Atualizar adaptadores se o escopo da regra mudou: `CLAUDE.md`, `GEMINI.md`, `.claude/rules/*.md`, `.cursor/rules/*.mdc`, `.github/copilot-instructions.md`, `.codex/agents/*.toml`, `.codex/hooks.json`.
5. Atualizar `.agents/skills/*/SKILL.md` se a mudança altera fluxo de criação padrão; manter espelho em `.claude/skills/` quando aplicável.
6. Atualizar `.claude/agents/*.md` e `.codex/agents/*.toml` se altera escopo/responsabilidade de um agente. Criar novo agente se o domínio é novo.
7. Criar/atualizar ADR em `docs/adr/` (formato MADR) para decisões.
8. Migration Flyway obrigatória se mexeu em `backend/.../model/` (ver `database.md`); testes na mesma PR cobrindo a política de cobertura (ver `testing.md`).

**Princípios:** documento é fonte de verdade; atomicidade (1 PR cobre tudo); justificar decisões; explicitar substituição de decisões antigas. O `.github/pull_request_template.md` traz este checklist; o hook `Stop` (`.claude/settings.json`) avisa se `docs/analysis_results.md` não foi tocado.

---

## Comandos

```bash
# Raiz
npm run dev          # frontend dev server
npm run build        # build frontend
npm run test         # testes frontend
npm run ci           # validação local equivalente ao CI (backend + frontend) — scripts/ci-local.sh
npm run backend:build / backend:run / backend:test
npm run format / format:check   # Prettier
npm run lint         # ESLint (frontend)

# Frontend (cd frontend)
npm run dev / build / test / test:watch / test:coverage

# Backend (cd backend)
./gradlew build      # compila + testes + JaCoCo (falha se cobertura < política)
./gradlew bootRun    # porta 8080
./gradlew test --tests "com.ebbin.api.SomeTest"
./gradlew dependencyCheckAnalyze   # OWASP CVE scan
```

---

## Restrições absolutas (NUNCA fazer)

- Sem `any` em TypeScript.
- Sem `@Autowired` em field — injeção por construtor.
- Sem expor entidade JPA em controller — sempre DTO.
- Sem retornar `message` em vez de `detail` nos erros (RFC 9457 ProblemDetail).
- Sem modificar migration Flyway já mergeada em `main` — criar **nova** migration (próximo número via `docs/conventions/database.md`).
- Sem mexer em `model/` (mudança de schema) sem migration na mesma PR.
- Sem criar `tailwind.config.js`.
- Sem adicionar `base` ao `vite.config.ts` sem ajustar o workflow de deploy.
- Sem Context API para estado de subjects — use `useSubjects`.
- Sem mudar o formato do `ebbing_session` sem atualizar `api.ts`.
- Sem código de produção novo sem teste correspondente na mesma PR.
- Sem secret/API key no código.
- Sem ignorar exceções silenciosamente.
- Sem referência a Claude/Codex/Gemini/IA em commits ou `Co-Authored-By`.
- Sem esquecer o Roteiro de manutenção ao alterar features.

## Arquitetura resumida

- Monorepo com `frontend/` e `backend/` independentes (build, CI e deploy separados).
- Backend em camadas: `controller/ → service/ → repository/`, pacote `com.ebbin.api`.
- Frontend: rotas em `App.tsx`; estado FSRS centralizado em `useSubjects`; `useRoutine`/`useReviewPreferences` com backend autoritativo + cache otimista.

Detalhes técnicos: ver `docs/conventions/`. Decisões: ver `docs/adr/`. Operação: ver `docs/runbooks/`.
