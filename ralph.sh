#!/usr/bin/env bash
# Ralph Loop runner for Antigravity (agy) — MissionNight
#
# Phase 1 (build, ~100 min):
#   bash ralph.sh
# Phase 2 (post-rehearsal fixes, ~35 min):
#   TASK_FILE=fix_plan.md MAX_ITERS=6 bash ralph.sh
set -uo pipefail

# --- Absolute path. agy does NOT inherit the shell's cwd as its workspace. ---
REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

TASK_FILE="${TASK_FILE:-PRD.md}"
MODEL="${RALPH_MODEL:-Gemini 3.1 Pro (High)}"   # must match the string shown in the Antigravity UI
MAX_ITERS="${MAX_ITERS:-20}"
STALL_LIMIT="${STALL_LIMIT:-3}"
PRINT_TIMEOUT="${PRINT_TIMEOUT:-7m}"

TASKS="$REPO/$TASK_FILE"
PROGRESS="$REPO/progress.txt"
SENTINEL="$REPO/DONE"
RUNLOG="$REPO/ralph-run.log"

# --- Preflight ---
command -v agy >/dev/null 2>&1 || { echo "agy not on PATH"; exit 1; }
[ -f "$TASKS" ] || { echo "$TASK_FILE not found"; exit 1; }
[ -d "$REPO/.git" ] || git init -q "$REPO"
[ -f "$PROGRESS" ] || : > "$PROGRESS"
rm -f "$SENTINEL"

# Progress metric: completed checkboxes in the task file + current git HEAD
metric() {
  local checked head
  checked=$(grep -c '^- \[x\]' "$TASKS" 2>/dev/null | tr -d '\n' || true)
  [ -z "$checked" ] && checked=0
  head=$(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo none)
  echo "${checked}:${head}"
}

PROMPT="The project directory is: $REPO
All file reads, file writes, and git commits MUST happen inside that exact directory.
Never create files outside it. Never ask the user anything. Never wait for confirmation.

Follow these steps exactly, then stop:
1. Read $REPO/$TASK_FILE in full. It contains the task list AND the operating rules. Obey the operating rules literally.
2. Read $REPO/progress.txt to see what is already done.
3. Pick exactly ONE task that is still unchecked, in the order they appear. Exactly one. Do not start a second task. Do not skip ahead to an optional task while any earlier task is unchecked.
4. Implement it until its 'Done when:' condition is literally satisfied. Run the verification command yourself and read its output. If it fails, fix it and run it again.
5. Only after verification passes, change that task's '- [ ]' to '- [x]' in $TASK_FILE.
6. Append ONE line to progress.txt in this format:
   <ISO8601 time> | <task id> | <what you changed> | <verification command and its result>
   Append only. Never delete, reorder or rewrite existing lines in progress.txt.
7. Run: git add -A && git commit -m \"<task id>: <short summary>\"
8. If and only if EVERY task in $TASK_FILE is now [x], create an empty file at $REPO/DONE
Then stop. Do not continue to another task."

TOTAL=$(grep -c '^- \[[ x]\]' "$TASKS" 2>/dev/null || echo 0)
echo "=== Ralph start $(date -Iseconds) | tasks=$TASK_FILE($TOTAL) | model=$MODEL | max=$MAX_ITERS ===" | tee -a "$RUNLOG"

stall=0
for i in $(seq 1 "$MAX_ITERS"); do
  before="$(metric)"
  echo "--- iter $i/$MAX_ITERS | before=$before | $(date +%H:%M:%S) ---" | tee -a "$RUNLOG"

  # Seal every point where the loop could stop and wait for a human.
  # agy separates execution mode from permission approval, so both flags are required.
  agy -p "$PROMPT" \
      --model "$MODEL" \
      --add-dir "$REPO" \
      --mode accept-edits \
      --dangerously-skip-permissions \
      --disable-slash-commands \
      --print-timeout "$PRINT_TIMEOUT" 2>&1 | tee -a "$RUNLOG"
  rc="${PIPESTATUS[0]}"

  after="$(metric)"
  echo "--- iter $i done | rc=$rc | after=$after | $(date +%H:%M:%S) ---" | tee -a "$RUNLOG"

  # 배포 반영. 실패해도 루프 판정에 영향을 주지 않는다.
  if [ "$before" != "$after" ]; then
    git -C "$REPO" push >/dev/null 2>&1 && echo "    pushed" | tee -a "$RUNLOG" || echo "    push 실패 (무시하고 계속)" | tee -a "$RUNLOG"
  fi

  if [ -f "$SENTINEL" ]; then
    echo "=== ALL TASKS DONE at iter $i ===" | tee -a "$RUNLOG"
    break
  fi

  if [ "$rc" -ne 0 ] || [ "$before" = "$after" ]; then
    stall=$((stall + 1))
    echo "!!! stall $stall/$STALL_LIMIT" | tee -a "$RUNLOG"
    if [ "$stall" -ge "$STALL_LIMIT" ]; then
      echo "=== ABORT: no progress for $STALL_LIMIT iterations. Split the current task in two. ===" | tee -a "$RUNLOG"
      exit 2
    fi
    sleep $((5 * stall))   # backoff
  else
    stall=0
    sleep 2
  fi
done

echo "=== Ralph end $(date -Iseconds) | $(grep -c '^- \[x\]' "$TASKS") / $TOTAL ===" | tee -a "$RUNLOG"