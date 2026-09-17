#!/usr/bin/env bash
# PostToolUse(Write|Edit) on prisma/schema/*.prisma: validate immediately, so a broken
# relation is caught before the agent moves on rather than at the next manual check.
set -uo pipefail

input=$(cat)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$path" in
  */prisma/schema/*.prisma|prisma/schema/*.prisma)
    out=$(cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)" && pnpm exec prisma validate 2>&1)
    status=$?
    if [ $status -ne 0 ]; then
      jq -n --arg out "$out" \
        '{decision:"block",reason:("prisma validate failed after this schema edit:\n\n" + $out)}'
    fi
    ;;
esac
exit 0
