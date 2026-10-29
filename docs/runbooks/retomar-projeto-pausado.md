# Runbook — Retomar o projeto pausado

O Ebbing foi pausado em **2026-10-28** para cortar o custo do Railway enquanto não há
tempo para o projeto. O que foi desligado:

| Peça                                                 | Estado na pausa                                          | Onde fica o necessário para voltar                                              |
| ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Backend + Postgres (Railway)                         | Projeto **apagado**                                      | Dump `pg_dump -Fc` e variáveis do backend em `~/Backups/ebbing/` no Mac do dono |
| Frontend (Vercel, `www.ebbing.com.br`)               | Projeto `revisao-espacada` **pausado**                   | Nada a restaurar — só despausar                                                 |
| Domínio `ebbing.com.br`                              | Mantido registrado, apontando para a Vercel              | —                                                                               |
| Repositório no GitHub                                | **Arquivado** (só leitura; Dependabot parado)            | —                                                                               |
| CI (runner `hermes-revisao-espacada` na VM `hermes`) | Serviço desligado; usuário `ci-revisao-espacada` mantido | —                                                                               |
| Runner `ebbing-mac-1` no Mac                         | Removido                                                 | `scripts/ci-runner.sh`                                                          |
| Monitoramento (`silistech-ops`, Hermes)              | Repo, backend e sites removidos da config                | Reverter os PRs da pausa                                                        |

## Passo a passo

1. **Desarquivar o repositório:** `gh repo unarchive maciomeneses/revisao-espacada --yes`.
2. **Recriar o backend no Railway:**
   - novo projeto com um serviço Postgres e um serviço apontando para `backend/`
     (o `railway.json` já define o build por Dockerfile);
   - restaurar o banco a partir do dump:
     ```bash
     pg_restore --no-owner --no-privileges -d "$DATABASE_PUBLIC_URL" ~/Backups/ebbing/ebbing-2026-10-28.dump
     ```
   - reaplicar as variáveis salvas em `~/Backups/ebbing/backend-env-2026-10-28.json`,
     trocando o que mudou de endereço (`PG*`, `DATABASE_URL`, os domínios do Railway).
     Manter os mesmos `JWT_*` faz com que as sessões e os links já emitidos continuem válidos.
   - conferir `/actuator/health` e seguir `deploy-backend-railway.md`.
3. **Frontend:** despausar o projeto `revisao-espacada` na Vercel. Se a URL do backend
   mudou, atualizar `VITE_API_URL` na Vercel e em `frontend/.env.production` e fazer um
   redeploy (ver `deploy-frontend-vercel.md`).
4. **CI:** religar o runner da VM:
   `ssh hermes 'sudo systemctl enable --now actions.runner.maciomeneses-revisao-espacada.hermes-revisao-espacada.service'`.
   A variável `CI_RUNNER=hermes` continua definida no repo.
5. **Monitoramento:** reverter os PRs da pausa no `silistech-ops` e devolver `revisao-espacada` a `repos` em
   `hermes-oci/devops/config.json`, copiando para a VM (`scp devops/config.json hermes:~/.hermes/devops/`).
6. **Divulgação (opcional):** voltar o card do Ebbing no blog (`new-blog`) e no site da Silis Tech
   (`silis-tech`), revertendo os PRs que o removeram.
