# GEMINI.md — Ebbing (Revisão Espaçada)

> **Adaptador Gemini CLI / Google Antigravity.** A fonte canônica neutra é `AGENTS.md` (raiz). Convenções técnicas vivem em `docs/conventions/`. O mapa do harness agnóstico fica em `docs/ai-harness.md`.

## Ordem de leitura

1. `AGENTS.md` — contrato operacional do projeto.
2. `docs/agent-playbook.md` — antes de qualquer mudança no código.
3. Para tarefas não-triviais: `docs/analysis_results.md`.
4. Antes de editar código: o arquivo relevante em `docs/conventions/`.

## Regra de adaptador

Este arquivo não deve conter regra técnica exclusiva. Se uma regra vale para Claude Code, Codex, Gemini, Cursor ou Copilot, mova-a para `AGENTS.md`, `docs/agent-playbook.md` ou `docs/conventions/`.

## Commit

Nunca referencie Gemini, Codex, Claude ou qualquer ferramenta/modelo de IA em commits ou `Co-Authored-By`.
