## Resumo

<!-- O que esta PR faz e por quê. -->

## Mudanças

<!-- Lista objetiva das principais mudanças. -->

## Verificação

- [ ] `npm run format:check` e `npm run lint` passam
- [ ] Frontend: `cd frontend && npm run test:coverage` passa (per-file 90/90/85/90)
- [ ] Backend: `cd backend && ./gradlew build` passa (JaCoCo 90/85/90 agregado e per-class)

## Checklist do Roteiro de manutenção (AGENTS.md)

Marque o que se aplica — atualizado na **mesma PR**:

- [ ] `docs/analysis_results.md` (documento mestre) atualizado
- [ ] `AGENTS.md` atualizado (se mudança global)
- [ ] `docs/conventions/*.md` atualizado (fonte única das regras)
- [ ] Adaptadores propagados (`CLAUDE.md`, `GEMINI.md`, `.claude/rules/*`, `.cursor/rules/*`, `.github/copilot-instructions.md`, `.codex/agents/*.toml`, `.codex/hooks.json`)
- [ ] `.agents/skills/*` e/ou `.claude/agents` / `.codex/agents` atualizados (se mudou fluxo/responsabilidade)
- [ ] ADR criado/atualizado em `docs/adr/` (se houve decisão)
- [ ] Migration Flyway `V13+` criada (se mexeu em `model/`) + testes na mesma PR
- [ ] Commits seguem Conventional Commits e **não** citam ferramentas de IA
