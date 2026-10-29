# Runbook — Retomar o projeto pausado

O Ebbing foi pausado em **2026-10-28** para cortar o custo do Railway enquanto não há
tempo para o projeto. O que foi desligado:

| Peça                                                 | Estado na pausa                                                                     | Onde fica o necessário para voltar                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Backend + Postgres (Railway)                         | Serviços **parados** (`railway down`); projeto `Ebbin`, volume e variáveis mantidos | Backup extra em `~/Backups/ebbing/` no Mac do dono (dump `pg_dump -Fc` + variáveis) |
| Frontend (Vercel, `www.ebbing.com.br`)               | Projeto `revisao-espacada` **pausado**                                              | Nada a restaurar — só despausar                                                     |
| Domínio `ebbing.com.br`                              | Mantido registrado, apontando para a Vercel                                         | —                                                                                   |
| Repositório no GitHub                                | **Arquivado** (só leitura; Dependabot parado)                                       | —                                                                                   |
| CI (runner `hermes-revisao-espacada` na VM `hermes`) | Serviço desligado; usuário `ci-revisao-espacada` mantido                            | —                                                                                   |
| Runner `ebbing-mac-1` no Mac                         | Removido                                                                            | `scripts/ci-runner.sh`                                                              |
| Monitoramento (`silistech-ops`, Hermes)              | Repo, backend e sites removidos da config                                           | Reverter os PRs da pausa                                                            |

## Passo a passo

1. **Desarquivar o repositório:** `gh repo unarchive maciomeneses/revisao-espacada --yes`.
2. **Religar o backend no Railway** (projeto `Ebbin`): fazer redeploy do serviço `Postgres`
   e depois do `revisao-espacada` (dashboard → serviço → Deployments → Redeploy). O volume,
   as variáveis e o domínio `revisao-espacada-production.up.railway.app` foram mantidos,
   então nada muda no frontend. Conferir `/actuator/health` e seguir `deploy-backend-railway.md`.

   Só se o projeto tiver sido apagado: criar um projeto novo (Postgres + serviço apontando para
   `backend/`), restaurar o dump e reaplicar as variáveis salvas, trocando o que mudou de
   endereço (`PG*`, `DATABASE_URL`, os domínios do Railway):

   ```bash
   pg_restore --no-owner --no-privileges -d "$DATABASE_PUBLIC_URL" ~/Backups/ebbing/ebbing-2026-10-28.dump
   ```

3. **Frontend:** despausar o projeto `revisao-espacada` na Vercel. Se a URL do backend
   mudou (só no caso do projeto recriado), atualizar `VITE_API_URL` na Vercel e em `frontend/.env.production` e fazer um
   redeploy (ver `deploy-frontend-vercel.md`).
4. **CI:** religar o runner da VM:
   `ssh hermes 'sudo systemctl enable --now actions.runner.maciomeneses-revisao-espacada.hermes-revisao-espacada.service'`.
   A variável `CI_RUNNER=hermes` continua definida no repo.
5. **Monitoramento:** reverter os PRs da pausa no `silistech-ops` e devolver `revisao-espacada` a `repos` em
   `hermes-oci/devops/config.json`, copiando para a VM (`scp devops/config.json hermes:~/.hermes/devops/`).
6. **Divulgação (opcional):** voltar o card do Ebbing no blog (`new-blog`) e no site da Silis Tech
   (`silis-tech`), revertendo os PRs que o removeram.
