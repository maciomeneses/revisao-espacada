# Harness de IA — mapa do padrão "Canônico + Adaptadores"

Este projeto é configurado para múltiplas ferramentas de IA (Claude Code, Codex, Cursor, Gemini, Copilot) com um único conjunto de regras. Leia este arquivo antes de alterar instruções de agentes, skills, hooks ou adaptadores.

## Princípio

Toda regra nasce numa **fonte neutra**. Os **adaptadores** apenas carregam, apontam ou espelham — **nunca** contêm regra técnica exclusiva. Se uma regra vale para mais de uma ferramenta, ela pertence a uma fonte neutra.

## Fontes neutras (verdade única)

| Arquivo                    | Papel                                        |
| -------------------------- | -------------------------------------------- |
| `AGENTS.md`                | Contrato operacional + roteiro de manutenção |
| `docs/agent-playbook.md`   | Briefing de sessão fresca                    |
| `docs/conventions/*.md`    | Regras técnicas (7 arquivos)                 |
| `docs/analysis_results.md` | Documento mestre (produto/arquitetura)       |
| `docs/adr/*.md`            | Decisões arquiteturais (MADR)                |
| `docs/runbooks/*.md`       | Procedimentos operacionais                   |

## Adaptadores (só apontam/espelham)

| Arquivo                           | Ferramenta  | Conteúdo                                |
| --------------------------------- | ----------- | --------------------------------------- |
| `CLAUDE.md`                       | Claude Code | Ordem de leitura + ponteiros            |
| `GEMINI.md`                       | Gemini CLI  | Ordem de leitura + regra de adaptador   |
| `.claude/rules/*.md`              | Claude Code | Shim com glob + `@docs/conventions/...` |
| `.cursor/rules/*.mdc`             | Cursor      | Shim com `globs` + referência           |
| `.github/copilot-instructions.md` | Copilot     | Resumo + ponteiros                      |
| `.codex/agents/*.toml`            | Codex       | Agentes especializados (TOML)           |
| `.codex/hooks.json`               | Codex       | Espelho dos hooks do Claude             |

## Agentes e skills

- Agentes vivem em `.claude/agents/*.md` (Claude) e `.codex/agents/*.toml` (Codex) — devem ficar **semanticamente alinhados**. Os 5 agentes: `especialista-fsrs`, `revisor-backend`, `revisor-frontend`, `escritor-testes`, `validador-deploy`.
- Skills neutras em `.agents/skills/*/SKILL.md`; espelho opcional em `.claude/skills/`.

## Regra de manutenção

Ao alterar qualquer regra: edite a **fonte neutra** primeiro, depois propague aos adaptadores afetados na **mesma PR** (passo 4 do roteiro em `AGENTS.md`). Cada `.claude/rules/*.md` e `.cursor/rules/*.mdc` deve ter um `docs/conventions/*.md` correspondente — não criar shim sem fonte.
