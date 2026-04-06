#!/usr/bin/env bash
# Hook PostToolUse: roda testes relacionados e injeta resultado no contexto do Claude.
# Compatível com bash 3.2 (macOS default).

set -uo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null || echo "")

# Ignora se não há file_path ou se é arquivo de teste/setup
if [[ -z "$FILE_PATH" ]] || [[ "$FILE_PATH" == *.test.* ]] || [[ "$FILE_PATH" == *.spec.* ]] || [[ "$(basename "$FILE_PATH")" == "setup.ts" ]]; then
  exit 0
fi

GIT_ROOT=$(git -C "$(dirname "$FILE_PATH")" rev-parse --show-toplevel 2>/dev/null || echo "")
if [[ -z "$GIT_ROOT" ]]; then
  exit 0
fi

CLASS_NAME=$(basename "$FILE_PATH")
CLASS_NAME="${CLASS_NAME%.*}"

# Emite o resultado como JSON com additionalContext para o Claude
emit_result() {
  local exit_code="$1"
  local raw_output="$2"
  local class="$3"

  export TEST_EXIT_CODE="$exit_code"
  export TEST_OUTPUT="$raw_output"
  export TEST_CLASS="$class"

  python3 << 'PYEOF'
import json, os, re

output = os.environ.get('TEST_OUTPUT', '')
exit_code = int(os.environ.get('TEST_EXIT_CODE', '0'))
class_name = os.environ.get('TEST_CLASS', 'arquivo')

# Remove ANSI color codes
clean = re.sub(r'\x1b\[[0-9;]*m', '', output)

if exit_code == 0:
    summary_lines = [l.strip() for l in clean.split('\n')
                     if 'passed' in l.lower() and ('test' in l.lower() or 'tests' in l.lower())]
    summary = summary_lines[-1] if summary_lines else 'OK'
    context = f"Testes passando após edição de {class_name}: {summary}"
    result = {
        'hookSpecificOutput': {
            'hookEventName': 'PostToolUse',
            'additionalContext': context
        }
    }
else:
    fail_lines = [l.strip() for l in clean.split('\n')
                  if any(k in l for k in ['FAIL', 'Error', '×', 'AssertionError', 'FAILED', 'expected'])
                  and l.strip()][:12]
    context = f"TESTES FALHANDO após edição de {class_name}:\n" + '\n'.join(fail_lines)
    result = {
        'systemMessage': f'Testes falhando em {class_name} — corrija antes de continuar',
        'hookSpecificOutput': {
            'hookEventName': 'PostToolUse',
            'additionalContext': context
        }
    }

print(json.dumps(result))
PYEOF
}

# ── Frontend (Vitest) ────────────────────────────────────────────────────────
if [[ "$FILE_PATH" == */frontend/src/* ]]; then
  TEST_FILES=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && TEST_FILES+=("$line")
  done < <(find "$GIT_ROOT/frontend/tests" -name "*${CLASS_NAME}*.test.*" 2>/dev/null)

  if [[ ${#TEST_FILES[@]} -eq 0 ]]; then
    exit 0
  fi

  RAW=$(cd "$GIT_ROOT/frontend" && npx vitest run "${TEST_FILES[@]}" --reporter=verbose 2>&1)
  CODE=$?
  emit_result "$CODE" "$RAW" "$CLASS_NAME"
  exit 0
fi

# ── Backend (Gradle) ─────────────────────────────────────────────────────────
if [[ "$FILE_PATH" == */backend/src/main/java/*.java ]]; then
  GRADLE_ARGS=()
  while IFS= read -r TEST_FILE; do
    [[ -z "$TEST_FILE" ]] && continue
    PACKAGE=$(grep -m1 "^package " "$TEST_FILE" | sed 's/package //;s/;//' | tr -d '[:space:]')
    TEST_CLASS=$(basename "$TEST_FILE" .java)
    GRADLE_ARGS+=(--tests "${PACKAGE}.${TEST_CLASS}")
  done < <(find "$GIT_ROOT/backend/src/test" -name "*${CLASS_NAME}*Test.java" 2>/dev/null)

  if [[ ${#GRADLE_ARGS[@]} -eq 0 ]]; then
    exit 0
  fi

  RAW=$(cd "$GIT_ROOT/backend" && ./gradlew test "${GRADLE_ARGS[@]}" 2>&1)
  CODE=$?
  emit_result "$CODE" "$RAW" "$CLASS_NAME"
  exit 0
fi

exit 0
