# Runbook — CI em runner self-hosted (fallback de billing)

> **Quando usar:** os minutos do GitHub Actions esgotaram/billing falhou (sintoma: todo check
> falha em ~3s com _"The job was not started because recent account payments have failed or
> your spending limit needs to be increased"_). Este runbook mantém o CI **automático** rodando
> no MacBook, a custo zero, sem alterar a lógica dos workflows. Padrão trazido do ecko-agro.

## Como funciona

- Os dois workflows (`ci-backend.yml`, `ci-frontend.yml`) declaram
  `runs-on: ${{ vars.CI_RUNNER || 'ubuntu-latest' }}`.
- A **variável de repositório** `CI_RUNNER` seleciona o executor:
  - `hermes` (**atual**, desde out/2026) → runner `hermes-revisao-espacada` na VM Oracle Always
    Free que roda o agente Hermes (Linux ARM64, OpenJDK 25 instalado para a toolchain do Gradle).
    Funciona 24/7, sem depender do Mac ligado. Lado da VM documentado no repositório `hermes-oci`,
    em `devops/README.md`.
  - `self-hosted` → runner registrado neste Mac (serviço launchd). Push/PR disparam checks
    normalmente, de graça.
  - `ubuntu-latest` (ou ausente) → runner do GitHub (comportamento original).
- Passos de cache de rede (`setup-java`/`setup-node`) só ativam em runner do GitHub
  (`runner.environment == 'github-hosted'`) — no Mac, `~/.gradle` e o cache do npm já persistem
  no disco e o upload de cache só desperdiçaria tempo.

## Setup (uma vez)

```bash
scripts/ci-runner.sh install                                  # baixa, registra e sobe o serviço
gh variable set CI_RUNNER --repo maciomeneses/revisao-espacada --body self-hosted
```

Validação: `gh workflow run ci-backend.yml --ref main && gh run watch`.

## Operação

```bash
scripts/ci-runner.sh status   # serviço local + runners registrados + valor de CI_RUNNER
scripts/ci-runner.sh stop     # pausa (jobs ficam em fila no GitHub)
scripts/ci-runner.sh start    # retoma
```

Logs do runner: `~/actions-runner-ebbing/_diag/`.

## Reversão (quando o billing normalizar)

```bash
gh variable set CI_RUNNER --repo maciomeneses/revisao-espacada --body ubuntu-latest
scripts/ci-runner.sh remove   # desregistra do GitHub e apaga serviço/pasta
```

## Cuidados e limitações

- **Só para repositório privado.** Em repo público, PR de fork executaria código arbitrário
  nesta máquina. Se o repo for tornado público, remova o runner antes.
- **Java:** no runner do GitHub o build compila com **Java 21**; no Mac, a toolchain do Gradle
  resolve o **JDK 25 local**. A regra "evitar features de Java 22+" (`docs/agent-playbook.md`)
  continua valendo — ela protege a volta ao `ubuntu-latest`.
- O runner executa 1 job por vez; jobs simultâneos entram em fila (aceitável para este repo).
- A máquina precisa estar ligada/acordada para os checks rodarem; com o runner offline os jobs
  ficam `queued` até ele voltar. Nesse caso o gate é o fluxo manual: `npm run ci` local +
  registrar no PR que a validação foi local (ver `docs/conventions/gitflow.md`).
