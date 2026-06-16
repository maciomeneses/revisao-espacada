# 0004 — Deploy: GitHub Pages (frontend) + Railway (backend)

- Status: aceito
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
