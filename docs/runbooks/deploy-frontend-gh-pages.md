# Runbook — Deploy do frontend (GitHub Pages)

> ⚠️ **Obsoleto (2026-07-09).** O GitHub Pages deste repositório foi desativado, a
> branch `gh-pages` não existe no remote e o workflow descrito abaixo virou CI puro
> (`ci-frontend.yml`, sem etapa de deploy). A produção do Ebbing é servida em
> `https://my.ebbin.app` (host próprio, fora deste repositório). Mantido apenas como
> registro histórico — ver nota no ADR-0004.

## Automático (recomendado)

Push em `main` tocando `frontend/**` dispara `.github/workflows/deploy-frontend.yml`:

1. `npm ci`
2. `npm run test:coverage` (falha se cobertura per-file < política)
3. build com `VITE_API_URL` injetado do secret do repositório
4. publica em `gh-pages`

## Pré-requisitos do repositório

- Secret **`VITE_API_URL`** configurado (Settings → Secrets) apontando para a URL Railway de produção.
- Branch `gh-pages` configurada como source do GitHub Pages.

## Manual (emergência)

```bash
cd frontend
npm run build        # tsc -b && vite build → dist/
npm run deploy       # gh-pages -d dist
```

## Cuidados

- `vite.config.ts` **sem `base`** (publica em `https://{user}.github.io/revisao-espacada/`). Mudar `base` exige ajustar este fluxo (ADR-0004).
- Toda env var nova precisa do prefixo `VITE_` e do secret correspondente.
