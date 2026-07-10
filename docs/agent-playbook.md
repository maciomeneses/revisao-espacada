# Agent Playbook — briefing de sessão fresca

Leia isto antes de qualquer mudança no código. Cobre os "tropeços" que não são óbvios pelo código.

## 1. Java 25 local vs Java 21 no CI

- O backend usa toolchain **Java 25** localmente, mas o CI (`ubuntu-latest`) roda **Java 21**.
- Evite features de Java 22+ que não compilem em Java 21, senão o CI quebra mesmo com build local verde.

## 2. Cobertura quebra o build

- Backend: `./gradlew build` roda JaCoCo com thresholds **agregado E per-class** (90/85/90). Classe nova abaixo de 90% **falha o build**. Rode `./gradlew jacocoTestCoverageVerification` antes de commitar.
- Frontend: `npm run test:coverage` usa thresholds **per-file** (90/90/85/90). Arquivo novo/modificado abaixo falha o CI de deploy.
- Detalhe e exclusões: `docs/conventions/testing.md`.

## 3. Migrations Flyway

- Só rodam no profile `prod`. Em dev, schema é via `ddl-auto`.
- **Imutáveis** após merge em `main`. Próxima = maior `V{n}` em `db/migration/` + 1 (ver `database.md`). Mexeu em `model/`? Crie migration.
- Runbook: `docs/runbooks/nova-migration-flyway.md`.

## 4. Onde ficam os testes

- Frontend: `frontend/tests/` (**não co-locados** com `src/`). Mockar `src/services/api.ts` inteiro e `localStorage` (`ebbing_session`).
- Backend: `backend/src/test/java/...` espelhando `src/main`.

## 5. Erros de API

- Backend retorna RFC 9457 **ProblemDetail** — campo `detail`, não `message`. O frontend faz `body.detail ?? body.message`. Manter consistência é crítico.

## 6. Frontend — armadilhas

- Tailwind 4 sem `tailwind.config.js`. `vite.config.ts` sem `base` (herança do deploy via GitHub Pages, hoje desativado — ADR-0004 obsoleto).
- Estado de subjects via `useSubjects` (não Context API). Callbacks que dependem de `routine`/`allowedDays` precisam incluí-los nas dep arrays (bug #21). Ver `docs/conventions/frontend-react.md` e `fsrs.md`.

## 7. Commits

- Conventional Commits validados por commitlint (hook `commit-msg`). **Nunca** citar IA no commit/`Co-Authored-By` (`docs/conventions/gitflow.md`).
- Após cada alteração concluída: commit + push.

## 8. Roteiro de manutenção

- Toda feature dispara o roteiro de `AGENTS.md` (docs + adaptadores + ADR + migration/testes na mesma PR). Checklist no PR template.

## 9. Quando usar subagente (`.claude/agents/` · `.codex/agents/`)

- `especialista-fsrs` — lógica/agendamento do FSRS.
- `revisor-backend` — controllers, services, JWT, migrations, JaCoCo.
- `revisor-frontend` — componentes, hooks, rotas, estado.
- `escritor-testes` — gerar testes Vitest/JUnit.
- `validador-deploy` — checagem antes de push/deploy.
