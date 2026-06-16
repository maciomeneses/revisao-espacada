#!/usr/bin/env bash
# Hook Stop: avisa se a sessão alterou código de produção mas não tocou o
# documento mestre (docs/analysis_results.md). Lembrete do Roteiro de manutenção
# (ver AGENTS.md). Não bloqueia — apenas injeta um aviso.
# Compatível com bash 3.2 (macOS default).

set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || echo .)}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

# Arquivos modificados na árvore de trabalho (staged + unstaged)
CHANGED=$(git status --porcelain 2>/dev/null || echo "")
[[ -z "$CHANGED" ]] && exit 0

# Houve mudança em código de produção?
TOUCHED_CODE=$(echo "$CHANGED" | grep -E '(frontend/src/|backend/src/main/)' || true)
# O documento mestre foi tocado?
TOUCHED_DOC=$(echo "$CHANGED" | grep -E 'docs/analysis_results\.md' || true)

if [[ -n "$TOUCHED_CODE" && -z "$TOUCHED_DOC" ]]; then
  echo '{"systemMessage":"AVISO: codigo de producao mudou, mas docs/analysis_results.md nao foi atualizado nesta sessao. Se entregou alguma feature, rode o Roteiro de manutencao (AGENTS.md): atualize o documento mestre, convencoes, adaptadores, ADR e migration/testes na mesma PR."}'
fi

exit 0
