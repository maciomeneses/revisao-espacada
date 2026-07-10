# 0004 — Deploy: GitHub Pages (frontend) + Railway (backend)

- Status: **obsoleto na parte do frontend** (2026-07-09) — o site do GitHub Pages foi
  desativado e a branch `gh-pages` não existe mais no remote; a produção do Ebbing é
  servida em `https://my.ebbin.app` (host próprio, fora deste repositório). O workflow
  virou CI puro (`ci-frontend.yml`) e o tooling `gh-pages` foi removido. A parte do
  **backend (Railway) segue valendo**. Formalizar o novo deploy do frontend em ADR
  futuro quando a decisão for documentada.
- Data: 2026-06-16

## Contexto

Projeto de baixo custo, dois apps independentes.

## Decisão

- Frontend: build estático Vite publicado no **GitHub Pages** via `gh-pages` (workflow `deploy-frontend.yml`, push em `main` tocando `frontend/**`). `VITE_API_URL` injetado de secret.
- Backend: **Railway** roda o JAR Spring Boot. CI (`ci-backend.yml`) compila e testa em **Java 21**.

## Consequências

- `vite.config.ts` **sem `base`** — adicionar `base` exige ajustar o workflow.
- GitHub Pages não faz SPA routing nativo; avaliar `404.html` se necessário (pergunta em aberto).
- CI em Java 21 mesmo com build local em Java 25: evitar features Java 22+.
- Runbooks: `docs/runbooks/deploy-frontend-gh-pages.md`, `deploy-backend-railway.md`.
