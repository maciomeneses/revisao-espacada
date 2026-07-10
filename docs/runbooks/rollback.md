# Runbook — Rollback

## Frontend

- A produção do Ebbing é servida em `https://www.ebbing.com.br` pela Vercel (fora deste
  repositório): use o **Instant Rollback** no dashboard da Vercel (histórico de
  deploys) ou reverta o commit em `main` (`git revert <sha>`) — o push redeploya.
- O fluxo antigo via GitHub Pages está desativado (ADR-0004 obsoleto).

## Backend (Railway)

- Usar o histórico de deploys do Railway para promover a versão anterior estável.
- Se o problema for de schema, **não** apague dados: prefira uma nova migration corretiva (`V{N+1}`) em vez de reverter migration aplicada em produção (migrations são imutáveis — `database.md`).

## Princípios

- Migrations aplicadas em produção não voltam atrás por edição; corrija com nova migration.
- Toda correção de rollback segue o Roteiro de manutenção (`AGENTS.md`): registrar o que houve no documento mestre e, se for decisão, criar ADR.
