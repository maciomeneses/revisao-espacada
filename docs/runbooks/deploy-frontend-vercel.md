# Runbook — Deploy do frontend (Vercel)

## Como funciona

O repositório está conectado à **Vercel** (integração GitHub — `vercel[bot]`):

- **Produção**: todo push em `main` gera deploy de produção em
  `https://www.ebbing.com.br` (o apex `ebbing.com.br` redireciona 307 para `www`).
- **Preview**: todo push em branch gera um preview automático (URL no check do PR).
- Nada disso consome minutos do GitHub Actions.

O DNS de `ebbing.com.br` fica no Cloudflare (apex A + `www` CNAME apontando para a
Vercel).

## Variáveis de ambiente

- `VITE_API_URL` — configurada no projeto da Vercel, aponta para o backend Railway
  (`https://revisao-espacada-production.up.railway.app`). Toda env nova do frontend
  precisa do prefixo `VITE_` e de entrada correspondente na Vercel.
- No **backend** (Railway), `FRONTEND_URL` deve ser `https://www.ebbing.com.br` —
  é a base dos links de e-mail (reset de senha, verificação).

## Rollback

- **Instant Rollback** no dashboard da Vercel (histórico de deploys), ou
- `git revert <sha>` em `main` — o push redeploya automaticamente.

## Cuidados

- `vite.config.ts` **sem `base`** — a Vercel serve o app na raiz do domínio.
- Erro de `tsc` quebra o build (`tsc -b && vite build`) e o deploy falha na Vercel;
  o site anterior permanece no ar.

## Histórico

O fluxo antigo via GitHub Pages (`gh-pages`) foi desativado — ver ADR-0004 (nota de
obsolescência) e `deploy-frontend-gh-pages.md` (mantido só como registro).
