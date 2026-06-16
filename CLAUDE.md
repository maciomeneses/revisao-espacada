# CLAUDE.md — Ebbing (Revisão Espaçada)

> **Adaptador Claude Code.** Este arquivo é carregado automaticamente em toda sessão. A fonte canônica neutra é `AGENTS.md` (raiz). As regras técnicas vivem em `docs/conventions/` — leia o arquivo relevante antes de editar código. O mapa do harness agnóstico está em `docs/ai-harness.md`.

## Ordem de leitura

1. `AGENTS.md` — contrato operacional + roteiro de manutenção.
2. `docs/agent-playbook.md` — briefing antes de qualquer mudança no código.
3. Para tarefas não-triviais: `docs/analysis_results.md` (documento mestre).
4. Antes de editar código: o arquivo relevante em `docs/conventions/`.

## Convenções (fonte única)

`docs/conventions/`: `backend-java.md`, `frontend-react.md`, `database.md`, `security.md`, `testing.md`, `fsrs.md`, `gitflow.md`.

## Regra de adaptador

Este arquivo **não** contém regra técnica exclusiva. Se uma regra vale para Claude Code, Codex, Gemini, Cursor ou Copilot, ela mora em `AGENTS.md`, `docs/agent-playbook.md` ou `docs/conventions/`. Ao alterar regras, edite a fonte neutra e propague aos adaptadores na mesma PR (roteiro em `AGENTS.md`).

## Sub-agentes especializados

Use o sub-agente adequado (`.claude/agents/`): `especialista-fsrs`, `revisor-backend`, `revisor-frontend`, `escritor-testes`, `validador-deploy`. Mantenha-os semanticamente alinhados aos adaptadores em `.codex/agents/*.toml` (ver `docs/ai-harness.md`).

## Commit

Nunca referencie Claude, Claude Code, Anthropic ou qualquer ferramenta/modelo de IA em commits ou `Co-Authored-By` (ver `docs/conventions/gitflow.md`).
