#!/usr/bin/env bash
# PostToolUse(Write|Edit) on src/**/*.ts(x): lint-fix just the written file. Fast by
# design — never the whole project.
set -uo pipefail

input=$(cat)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$path" in
  */src/*.ts|*/src/*.tsx|src/*.ts|src/*.tsx)
    root=$(git rev-parse --show-toplevel 2>/dev/null || echo .)
    (cd "$root" && pnpm exec eslint --fix "$path") >/dev/null 2>&1 || true
    ;;
esac
exit 0
