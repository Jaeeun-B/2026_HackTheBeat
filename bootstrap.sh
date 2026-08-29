#!/usr/bin/env bash
# bootstrap.sh — MissionNight, R1 전용 초기 세팅
#
# 이미 GitHub에 저장소가 있는 경우를 전제로 한다.
# 사용법:
#   git clone https://github.com/Jaeeun-B/2026_HackTheBeat.git
#   cd 2026_HackTheBeat
#   # PRD.md, ralph.sh, bootstrap.sh 를 이 폴더에 넣고
#   bash bootstrap.sh
set -uo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"
FAIL=0

say()  { printf "\n=== %s ===\n" "$1"; }
ok()   { printf "  [OK]   %s\n" "$1"; }
bad()  { printf "  [FAIL] %s\n" "$1"; FAIL=1; }

say "1. 도구 확인"
command -v git >/dev/null 2>&1 && ok "git $(git --version | awk '{print $3}')" || bad "git 없음"
command -v node >/dev/null 2>&1 && ok "node $(node -v)" || bad "node 없음"
command -v npm  >/dev/null 2>&1 && ok "npm $(npm -v)"  || bad "npm 없음"
if command -v agy >/dev/null 2>&1; then
  ok "agy 있음"
else
  bad "agy 없음 — 안티그래비티 IDE 명령 팔레트에서 CLI 설치 후 터미널 재시작"
fi

NODE_MAJOR=$(node -v 2>/dev/null | sed 's/v\([0-9]*\).*/\1/')
if [ -n "${NODE_MAJOR:-}" ] && [ "$NODE_MAJOR" -ge 20 ]; then
  ok "node 20 이상"
else
  bad "node 20 미만 — 지금 올릴 것"
fi

say "2. git 사용자 정보 (없으면 루프가 커밋에서 조용히 실패한다)"
GN=$(git config user.name  || true)
GE=$(git config user.email || true)
[ -n "$GN" ] && ok "user.name  = $GN"  || bad "git config --global user.name \"이름\""
[ -n "$GE" ] && ok "user.email = $GE" || bad "git config --global user.email \"메일\""

say "3. 저장소 확인"
if [ -d "$REPO/.git" ]; then
  ok "git 저장소"
  ORIGIN=$(git remote get-url origin 2>/dev/null || echo "")
  [ -n "$ORIGIN" ] && ok "origin = $ORIGIN" || bad "origin 없음 — git remote add origin <url>"
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  ok "현재 브랜치 = ${BRANCH:-unknown}"
else
  bad "여기는 git 저장소가 아니다. clone 한 폴더에서 실행할 것"
fi

say "4. 필수 파일"
[ -f "$REPO/PRD.md" ]   && ok "PRD.md"   || bad "PRD.md 없음"
[ -f "$REPO/ralph.sh" ] && ok "ralph.sh" || bad "ralph.sh 없음"
if [ -f "$REPO/PITCH.md" ]; then
  bad "PITCH.md 가 저장소 안에 있다. 밖으로 뺄 것 (루프가 읽고 혼란스러워한다)"
else
  ok "PITCH.md 없음 (정상)"
fi

say "5. .gitignore — 이게 없으면 node_modules 가 통째로 커밋된다"
if [ -f "$REPO/.gitignore" ] && grep -q "node_modules" "$REPO/.gitignore"; then
  ok ".gitignore 에 node_modules 있음"
else
  cat > "$REPO/.gitignore" <<'EOF'
node_modules/
dist/
.vercel/
.DS_Store
*.local
.env
.env.*
.venv/
venv/
__pycache__/
.idea/
.vscode/
EOF
  ok ".gitignore 생성함"
fi
# 로그와 진행 파일은 일부러 제외하지 않는다. 심사관에게 보여줄 증거다.

say "6. PRD T01 non-interactive 문구 확인"
if grep -qi "non-interactive" "$REPO/PRD.md" 2>/dev/null; then
  ok "T01 에 non-interactive 지시 있음"
else
  bad "T01 에 아래 문장을 추가할 것 (대화형 프롬프트에서 루프가 죽는다):
       Scaffold non-interactively. Use 'npm create vite@latest . -- --template react-ts'
       and 'npm install' with no interactive prompts. Do not run any command that opens
       an editor or a pager."
fi

say "7. 실행 권한과 초기 파일"
chmod +x "$REPO/ralph.sh" 2>/dev/null && ok "ralph.sh 실행 권한"
[ -f "$REPO/progress.txt" ] || : > "$REPO/progress.txt"
ok "progress.txt 준비"

say "8. 모델 이름"
if [ -n "${RALPH_MODEL:-}" ]; then
  ok "RALPH_MODEL = $RALPH_MODEL"
else
  bad "RALPH_MODEL 미설정 — 안티그래비티 UI 표시 문자열을 그대로:
       export RALPH_MODEL=\"Gemini 3.1 Pro (High)\""
fi

echo
if [ "$FAIL" -ne 0 ]; then
  echo "### 위의 [FAIL] 을 전부 해결한 뒤 다시 실행할 것. 여기서 넘어가면 나중에 20분을 잃는다."
  exit 1
fi

say "9. 첫 커밋"
git add -A
git commit -m "chore: seed PRD, loop runner and gitignore" || echo "  커밋할 변경 없음"
CUR_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if git rev-parse --abbrev-ref --symbolic-full-name "@{u}" >/dev/null 2>&1; then
  git push || bad "push 실패 — 원격 접근 권한 확인"
else
  git push -u origin "$CUR_BRANCH" || bad "push 실패 — 원격 접근 권한 확인"
fi

cat <<'EOF'

=== 준비 완료 ===

다음 순서:
  1) Vercel 에서 이 저장소를 Import. Framework=Vite, Build=npm run build, Output=dist
     (첫 빌드 실패는 정상. 코드가 아직 없다. URL 확보가 목적)
  2) 배포 URL 을 단톡방에 공유
  3) 스모크 테스트:
        MAX_ITERS=1 bash ralph.sh
     확인: git log 에 커밋 1개, progress.txt 한 줄, PRD 체크 1개, 파일이 이 폴더 안
  4) 본 실행:
        caffeinate -i bash ralph.sh 2>&1 | tee phase1.log

EOF