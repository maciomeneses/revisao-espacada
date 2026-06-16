# Convenção — Gitflow e Commits

> **Fonte canônica.** Verdade única para branches, commits e fluxo de trabalho.

## Branches

- `main` sempre deployável (dispara CI/deploy).
- Prefixos: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, `perf/`, `ci/`.
- Nome: `<prefixo>/<slug-curto>` (ex.: `feat/rotina-semanal`).
- Squash & merge (1 commit lógico por PR).

## Conventional Commits

Formato `tipo(escopo opcional): assunto`. Tipos: `feat`, `fix`, `test`, `chore`, `refactor`, `docs`, `perf`, `ci`, `build`, `revert`.

- Assunto no imperativo, minúsculo, sem ponto final, ≤ 100 chars no header.
- Validado por **commitlint** no hook `commit-msg` (ver `package.json` / `.husky/`).

## Regra de IA nos commits (OBRIGATÓRIA)

**Nunca** referenciar Claude, Codex, Gemini, Anthropic ou qualquer ferramenta/modelo de IA — nem na mensagem de commit, nem em `Co-Authored-By`. Vale para qualquer adaptador (`CLAUDE.md`, `GEMINI.md`, Cursor, Copilot, Codex).

## Fluxo de trabalho

- Após cada alteração concluída, fazer commit e push.
- Toda mudança de feature dispara o **Roteiro de manutenção** — ver `AGENTS.md`. Docs, adaptadores e código andam na **mesma PR** (atomicidade).
- `CHANGELOG.md` é gerado por git-cliff a partir dos Conventional Commits (`cliff.toml`).

## CI/CD (resumo)

- **Backend CI** (`.github/workflows/ci-backend.yml`): push/PR tocando `backend/**`, **Java 21** (Java 25 só local). `./gradlew build` inclui JaCoCo — falha se cobertura abaixo.
- **Frontend Deploy** (`.github/workflows/deploy-frontend.yml`): push em `main` tocando `frontend/**`; injeta `VITE_API_URL` do secret; `npm run test:coverage`; deploy via `gh-pages`.

## Restrições absolutas (NUNCA)

- Citar ferramenta/modelo de IA em commit ou `Co-Authored-By`.
- Commit fora do padrão Conventional Commits.
- Mergear feature sem rodar o Roteiro de manutenção (`AGENTS.md`).
