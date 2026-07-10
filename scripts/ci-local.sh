#!/usr/bin/env bash
#
# ci-local.sh — Roda localmente o equivalente ao CI do GitHub Actions.
#
# Espelha os dois jobs definidos em .github/workflows/:
#   - ci-backend.yml  → backend:  ./gradlew build --no-daemon
#   - ci-frontend.yml → frontend: npm ci && npm run test:coverage
#
# Útil quando os minutos do GitHub Actions acabaram: aqui não há GitHub nem
# Docker envolvido, roda offline e usa as mesmas validações (testes + thresholds
# de cobertura JaCoCo/Vitest que quebram o build se ficarem abaixo do limite).
#
# Uso:
#   scripts/ci-local.sh            # roda backend + frontend (igual ao CI)
#   scripts/ci-local.sh backend    # só o job de backend
#   scripts/ci-local.sh frontend   # só o job de frontend
#   FAST=1 scripts/ci-local.sh frontend   # usa `npm install` em vez de `npm ci`
#                                           (mais rápido; menos fiel ao CI)
#
# Diferenças conhecidas vs. CI (informativo, não bloqueiam):
#   - CI usa Java 21 + Node 22; localmente pode haver outras versões. A toolchain
#     do Gradle (Java 25) é resolvida igual nos dois lados via auto-provisioning.
#   - O passo de upload-artifact (.jar) do CI não é replicado: é só publicação,
#     não validação. O `.jar` fica em backend/build/libs/ após o build.

set -euo pipefail

# Raiz do repo, independente do diretório de onde o script é chamado.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bold=$'\033[1m'; green=$'\033[32m'; red=$'\033[31m'; cyan=$'\033[36m'; reset=$'\033[0m'

section() { printf '\n%s%s==> %s%s\n' "$bold" "$cyan" "$1" "$reset"; }
ok()      { printf '%s✓ %s%s\n' "$green" "$1" "$reset"; }
fail()    { printf '%s✗ %s%s\n' "$red" "$1" "$reset"; }

run_backend() {
  section "Backend — ./gradlew build --no-daemon (testes + JaCoCo)"
  ( cd "$ROOT/backend" && ./gradlew build --no-daemon )
  ok "Backend OK — jar em backend/build/libs/"
}

run_frontend() {
  if [[ "${FAST:-0}" == "1" ]]; then
    section "Frontend — npm install + npm run test:coverage (FAST)"
    ( cd "$ROOT/frontend" && npm install --silent )
  else
    section "Frontend — npm ci + npm run test:coverage (igual ao CI)"
    ( cd "$ROOT/frontend" && npm ci )
  fi
  ( cd "$ROOT/frontend" && npm run test:coverage )
  ok "Frontend OK — testes + thresholds de cobertura Vitest"
}

target="${1:-all}"
start=$(date +%s)

case "$target" in
  backend)  run_backend ;;
  frontend) run_frontend ;;
  all)      run_backend; run_frontend ;;
  *) fail "Alvo inválido: '$target' (use: backend | frontend | all)"; exit 2 ;;
esac

elapsed=$(( $(date +%s) - start ))
section "Concluído em ${elapsed}s"
ok "Todas as validações do alvo '$target' passaram."
