# 미션나잇 (MissionNight)

**Deployed URL:** [TBD - Static build deployment]

**Demo Instruction:**
Click "5분 데모로 체험하기" on the home screen, and four guest links appear.

**Judging Steps:**
1. Click "5분 데모로 체험하기" on the home screen, and four guest links appear.
2. Open a guest link in a new tab, and only that guest's mission is shown.
3. Step through all four guests on the reveal screen and land on the result card.

## For the founder judge

미션나잇은 오프라인 모임에서 모두가 각자의 폰으로 비밀 미션을 수행하며 서로에게 자연스럽게 스며들게 만드는 파티 게임입니다. 호스트가 링크를 나눠주는 즉시 시작되며, 게임이 진행되는 동안 누구도 화면만 들여다보지 않습니다. 가장 중요한 사실은 미션들이 서로 연결되어 있다는 점이며, 파티 마지막에 호스트가 연결 고리를 밝혀낼 때 모두에게 큰 웃음과 하이라이트를 선사합니다.

## For the engineer judge

This application is completely serverless. It relies purely on the browser's memory and the URL hash for state management.
- **Serverless Architecture & Memory Stores:** The application uses Vite, React, and TypeScript and builds to static files. There is no database, no authentication, and no external API. All application state—including guests, missions, and reveal results—is encoded directly in the URL hash (using `encodeURIComponent` and `btoa`), which guarantees Korean characters survive the round trip. The app supports taking photos during the reveal process and composing a visual recap image on a `<canvas>`, utilizing purely browser memory and object URLs without uploading anything to a backend.
- **Paired-Assignment Algorithm:** The logic in `src/lib/assign.ts` assigns guests to missions. It first pairs up guests and randomly assigns the `a` and `b` parts of a linked mission pair. If the guest count is odd, exactly one guest receives a solo mission. The assignment is deterministic based on a seed, so the same input always yields the same distribution. If there are more guests than the deck supports, it falls back to solo missions rather than failing.
- **Ralph Loop Generation:** This repository was built by a Ralph loop. You can review the step-by-step progress by reading `progress.txt` and examining the git commit log.

## For the investor judge

미션나잇은 참가자들이 본인의 미션 링크를 열기만 하면 되므로 별도의 가입이나 다운로드가 필요 없습니다. 오프라인 파티에 모인 인원들이 모두 바이럴의 대상이 되며, 확장하기 쉬운 구조입니다. 기본 덱을 무상 제공하여 파티에서 시연되게 한 후, 특수한 상황(연말 파티, 신입 환영회, 회식, 소개팅)에 맞는 프리미엄 덱을 판매해 수익을 창출할 수 있습니다. 서버 유지 비용이 0에 가깝기 때문에 이익률이 매우 높습니다.

## Task Mapping

| Task | Implementing Files |
|---|---|
| T01 Scaffold | `package.json`, `vite.config.ts`, `src/App.tsx`, `src/main.tsx` |
| T02 Codec | `src/lib/codec.ts` |
| T03 Mission deck as linked pairs | `src/data/deck-basic.json` |
| T04 Paired assignment | `src/lib/assign.ts` |
| T05 Host creation screen | `src/screens/Home.tsx` |
| T06 Guest screen | `src/screens/Mission.tsx` |
| T07 Reveal screen with pair connection | `src/screens/Reveal.tsx` |
| T08 Result card, connection map and carry-over | `src/screens/Result.tsx` |
| T09 Demo mode | `src/screens/Home.tsx` |
| T10 Themed deck showcase | `src/screens/Home.tsx` |
| T11 Error and empty states | `src/App.tsx`, `src/screens/Home.tsx`, `src/screens/Mission.tsx`, `src/screens/Reveal.tsx`, `src/screens/Result.tsx` |
| T12 Design pass | `src/App.css`, `src/index.css`, `src/screens/*.tsx` |
| T13 README | `README.md` |
| T14 Photo capture on reveal | `src/screens/Reveal.tsx`, `src/lib/imageScale.ts`, `src/lib/photoStore.ts` |
| T15 Recap image | `src/screens/Result.tsx`, `src/lib/recap.ts`, `tests/recap.test.mjs` |
