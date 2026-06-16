# 0001 — Monorepo com frontend e backend desacoplados

- Status: aceito
- Data: 2026-06-16

## Contexto

O Ebbing tem um SPA React e uma API Spring Boot. Precisávamos decidir como organizar os dois.

## Decisão

Manter um único repositório com `frontend/` e `backend/` **independentes**: gerenciadores de pacote, build, CI e deploy separados, sem código compartilhado. A raiz só oferece scripts de conveniência (`npm run dev`, `backend:run`, etc.).

## Consequências

- Simplicidade: cada app evolui e deploya por conta própria (GitHub Pages e Railway).
- Sem camada de tipos compartilhados — o contrato é mantido manualmente (ver ADR-0003, ADR-0007).
- CI segmentado por path (`frontend/**`, `backend/**`).
