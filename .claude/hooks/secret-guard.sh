#!/usr/bin/env bash
# PreToolUse(Bash) guard: deny commands that read or leak secrets.
# See CLAUDE.md invariant #4 and AGENTS.md section 5. Heuristic, not exhaustive —
# it exists to catch the common, easy-to-make mistakes, not to be a security boundary.
set -euo pipefail

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

# Strip single-quoted '...' spans before matching: in bash nothing inside single quotes
# ever expands, so text in there is always inert literal data (a JSON test fixture, a
# printf template, a commit message) — matching against it produces false positives.
# Double-quoted spans are left untouched on purpose: "$VAR" still expands inside double
# quotes, so a real secret reference must stay visible to the checks below.
cmd=$(printf '%s' "$cmd" | sed -E "s/'[^']*'//g")
block=""

envhit() {
  printf '%s' "$1" | grep -Eiq '\.env(\.[A-Za-z0-9_]+)?\b' \
    && ! printf '%s' "$1" | grep -Eiq '\.env\.example\b'
}

# env/printenv piped straight to a specific-var grep is the explicitly allowed form —
# checked first so it short-circuits the broader "bare dump" match below.
safe_env_grep() {
  printf '%s' "$1" | grep -Eiq '(^|\|) *(env|printenv) *\| *grep +[^|]+'
}

# Evaluate each independent statement on its own, not the whole command blob — a pipe
# within one statement ("env | grep X") must stay one unit for the safe-pattern check
# above, but two unrelated statements joined only by a newline/;/&&/||/& should not be
# able to trigger each other (an unrelated "| tail" on one line plus ".env" mentioned on
# a later, separate line is not "tail .env").
segments=$(printf '%s' "$cmd" | sed -E 's/(&&|\|\||;|&)/\n/g')

while IFS= read -r seg; do
  [ -z "$seg" ] && continue

  if printf '%s' "$seg" | grep -Eiq '(^|\|) *(cat|less|more|head|tail|bat) +' && envhit "$seg"; then
    block="reading a .env file directly"
  elif ! safe_env_grep "$seg" && printf '%s' "$seg" | grep -Eiq '(^|\|) *(env|printenv) *($|[|>])'; then
    block="dumping the full environment"
  elif printf '%s' "$seg" | grep -Eiq '(^|\|) *git +add' && envhit "$seg"; then
    block="staging a real .env file"
  elif printf '%s' "$seg" | grep -Eiq '(echo|printf|print)' \
    && printf '%s' "$seg" | grep -Eq 'LINKEDIN_PASSWORD|ENCRYPTION_KEY|AUTH_SECRET'; then
    block="printing a secret variable"
  fi

  [ -n "$block" ] && break
done <<< "$segments"

if [ -n "$block" ]; then
  reason="$block is blocked (CLAUDE.md invariant #4, AGENTS.md section 5): secrets must never be printed, echoed, or staged. Use the user's own terminal if .env needs inspecting."
  jq -n --arg reason "$reason" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$reason}}'
fi
