#!/usr/bin/env bash
#
# ci-runner.sh — gerencia o runner self-hosted do GitHub Actions deste repo.
#
# Contexto: fallback de billing do Actions (runbook docs/runbooks/ci-runner-self-hosted.md).
# Os workflows usam `runs-on: ${{ vars.CI_RUNNER || 'ubuntu-latest' }}`; com a variável de
# repositório CI_RUNNER=self-hosted, os jobs executam neste Mac sem consumir minutos pagos.
#
# Uso:
#   scripts/ci-runner.sh install   # baixa, registra e instala como serviço (launchd)
#   scripts/ci-runner.sh status    # estado do serviço + runners registrados no GitHub
#   scripts/ci-runner.sh start     # inicia o serviço
#   scripts/ci-runner.sh stop      # para o serviço
#   scripts/ci-runner.sh remove    # desregistra do GitHub e apaga o serviço/pasta
#
# Requisitos: gh autenticado com acesso admin ao repo.

set -euo pipefail

REPO="maciomeneses/revisao-espacada"
RUNNER_DIR="${HOME}/actions-runner-ebbing"
RUNNER_NAME="ebbing-mac-1"
RUNNER_VERSION="${RUNNER_VERSION:-2.335.1}"

bold=$'\033[1m'; green=$'\033[32m'; red=$'\033[31m'; cyan=$'\033[36m'; reset=$'\033[0m'
section() { printf '\n%s%s==> %s%s\n' "$bold" "$cyan" "$1" "$reset"; }
ok()      { printf '%s✓ %s%s\n' "$green" "$1" "$reset"; }
fail()    { printf '%s✗ %s%s\n' "$red" "$1" "$reset"; }

runner_arch() {
  case "$(uname -m)" in
    arm64)  echo "osx-arm64" ;;
    x86_64) echo "osx-x64" ;;
    *) fail "arquitetura não suportada: $(uname -m)"; exit 1 ;;
  esac
}

cmd_install() {
  if [[ -d "$RUNNER_DIR" ]]; then
    fail "$RUNNER_DIR já existe — rode 'remove' antes de reinstalar."
    exit 1
  fi
  local arch tarball url token
  arch="$(runner_arch)"
  tarball="actions-runner-${arch}-${RUNNER_VERSION}.tar.gz"
  url="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${tarball}"

  section "Baixando runner v${RUNNER_VERSION} (${arch})"
  mkdir -p "$RUNNER_DIR"
  curl -fsSL -o "${RUNNER_DIR}/${tarball}" "$url"
  tar -xzf "${RUNNER_DIR}/${tarball}" -C "$RUNNER_DIR"
  rm "${RUNNER_DIR}/${tarball}"

  section "Registrando no GitHub (${REPO})"
  token="$(gh api -X POST "repos/${REPO}/actions/runners/registration-token" -q .token)"
  ( cd "$RUNNER_DIR" && ./config.sh --url "https://github.com/${REPO}" \
      --token "$token" --name "$RUNNER_NAME" --unattended )

  section "Instalando como serviço (launchd)"
  ( cd "$RUNNER_DIR" && ./svc.sh install && ./svc.sh start )

  ok "Runner '${RUNNER_NAME}' instalado e rodando."
  printf '\nPróximo passo (aponta o CI para cá):\n  gh variable set CI_RUNNER --repo %s --body self-hosted\n' "$REPO"
}

cmd_status() {
  section "Serviço local"
  if [[ -d "$RUNNER_DIR" ]]; then
    ( cd "$RUNNER_DIR" && ./svc.sh status ) || true
  else
    fail "runner não instalado (${RUNNER_DIR} não existe)"
  fi
  section "Runners registrados no GitHub"
  gh api "repos/${REPO}/actions/runners" \
    -q '.runners[] | "\(.name)\t\(.status)\tbusy=\(.busy)"' || true
  section "Variável CI_RUNNER"
  gh variable get CI_RUNNER --repo "$REPO" 2>/dev/null || echo "(não definida → ubuntu-latest)"
}

cmd_start() { ( cd "$RUNNER_DIR" && ./svc.sh start ); }
cmd_stop()  { ( cd "$RUNNER_DIR" && ./svc.sh stop ); }

cmd_remove() {
  [[ -d "$RUNNER_DIR" ]] || { fail "runner não instalado"; exit 1; }
  local token
  section "Parando e desinstalando serviço"
  ( cd "$RUNNER_DIR" && ./svc.sh stop && ./svc.sh uninstall ) || true
  section "Desregistrando do GitHub"
  token="$(gh api -X POST "repos/${REPO}/actions/runners/remove-token" -q .token)"
  ( cd "$RUNNER_DIR" && ./config.sh remove --token "$token" )
  rm -rf "$RUNNER_DIR"
  ok "Runner removido."
  printf '\nLembre de devolver o CI ao runner do GitHub:\n  gh variable set CI_RUNNER --repo %s --body ubuntu-latest\n' "$REPO"
}

case "${1:-}" in
  install) cmd_install ;;
  status)  cmd_status ;;
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  remove)  cmd_remove ;;
  *) echo "Uso: $0 {install|status|start|stop|remove}"; exit 2 ;;
esac
