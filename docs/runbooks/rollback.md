# Runbook — Rollback

## Frontend (GitHub Pages)

- Reverter o commit problemático em `main` (`git revert <sha>`) e deixar o workflow `deploy-frontend.yml` republicar.
- Alternativa rápida: reexecutar um deploy anterior a partir do histórico de Actions, ou rebuildar de um commit bom e `npm run deploy`.

## Backend (Railway)

- Usar o histórico de deploys do Railway para promover a versão anterior estável.
- Se o problema for de schema, **não** apague dados: prefira uma nova migration corretiva (`V{N+1}`) em vez de reverter migration aplicada em produção (migrations são imutáveis — `database.md`).

## Princípios

- Migrations aplicadas em produção não voltam atrás por edição; corrija com nova migration.
- Toda correção de rollback segue o Roteiro de manutenção (`AGENTS.md`): registrar o que houve no documento mestre e, se for decisão, criar ADR.
