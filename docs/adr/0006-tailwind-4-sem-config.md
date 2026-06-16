# 0006 — Tailwind CSS 4 via plugin Vite, sem arquivo de config

- Status: aceito
- Data: 2026-06-16

## Contexto

Tailwind CSS 4 suporta configuração CSS-first e plugin oficial para Vite.

## Decisão

Usar `@tailwindcss/vite` sem `tailwind.config.js`. A configuração (tokens, tema) é feita via CSS.

## Consequências

- **Não criar `tailwind.config.js`** — quebra a expectativa do setup atual.
- Não usar classes/utilitários removidos na v4.
- Regra registrada em `docs/conventions/frontend-react.md`.
