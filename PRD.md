# PRD — MissionNight

## 0. One-line definition

A secret-mission party game whose missions are secretly paired. Each guest opens their own link and sees one mission nobody else can see, but half of those missions only complete because someone else in the room is unknowingly working on the other half. Nobody looks at a screen during the party. At the end, the host walks through the missions on a single screen, and as each pair is revealed the app draws the hidden connection between the two people.

## 1. Operating rules (re-read these every iteration)

- Complete **exactly one** task per session. Never start a second one.
- All file reads, writes and git commits happen inside this PRD's directory only.
- A `Done when:` condition counts as satisfied **only after you have run the verification command yourself and read its output.** Never mark a task done by visual judgement.
- `progress.txt` is append-only. Never delete, reorder or rewrite existing lines.
- Commit after every task. The commit message starts with the task id. Every commit is a deploy.
- **Do not introduce a backend, a database, authentication, environment variables, or any external API.** All party state lives in the URL hash and in browser memory. Roll back any change that violates this.
- **Images are never encoded into the URL hash.** Photos live only in browser memory as object URLs and leave the app only as a downloaded file.
- **A guest's payload never contains their partner's identity or mission.** The pairing is resolved only on the host's reveal screen. Leaking it into the guest payload destroys the entire mechanic.
- Do not expand scope. Do not add features that are not in this PRD. If you have an idea, append one line to `progress.txt` and move on.
- Never ask the user anything. When something is ambiguous, use the default written in this document.
- Do not reorder tasks. Work top to bottom. The order is the scoring priority. The last two tasks are optional extras that must never compromise anything above them, and must not be started while any earlier task is unchecked.

## 2. Technical constraints

- Vite + React + TypeScript + Tailwind. Static build only (`npm run build`).
- Hash routing: `#/`, `#/m/<payload>`, `#/reveal/<payload>`, `#/result/<payload>`
- Payload encoding is `encodeURIComponent` then `btoa`; decoding is the reverse. **Korean characters must survive the round trip.**
- Any image composition uses the Canvas API only. No image libraries.
- Tests run with `node --test` over `tests/*.test.mjs`. Do not add another test framework.
- Mobile first (375px baseline). Dark theme. All user-facing copy is in Korean.

## 3. Judging specification (highest implementation priority)

AI judges will operate this product in a browser and score what they observe. The submission declares **exactly three** steps, and all three must work **alone, with no camera, with no text input, with no failure**:

1. Click "5분 데모로 체험하기" on the home screen, and four guest links appear.
2. Open a guest link in a new tab, and only that guest's mission is shown.
3. Step through all four guests on the reveal screen and land on the result card.

Never make a change that breaks these three steps, for any reason. The pair-reveal animation in T07 is a presentation layer on top of step 3: if it fails to render for any reason, the reveal must still advance to the next guest and still reach the result card.

## 4. Tasks

- [x] **T01 Scaffold**
  Create a Vite + React + TS + Tailwind project in this directory. Wire hash routing to four empty screens (home / mission / reveal / result). Show the product name "미션나잇" on the home screen.
  **Scaffold non-interactively.** Use `npm create vite@latest . -- --template react-ts` followed by `npm install`. Never run a command that waits for input, opens an editor, or opens a pager. If a tool would prompt, pass the flag that skips the prompt. If the directory is not empty, scaffold in place rather than aborting.
  `Done when:` `npm run build` exits 0 and `dist/index.html` exists.

- [x] **T02 Codec**
  Add `encodePayload(obj)` and `decodePayload(str)` in `src/lib/codec.ts`.
  `Done when:` `node --test tests/codec.test.mjs` passes, covering a round trip of an object containing Korean text, an empty string returning null, and a corrupted string returning null without throwing.

- [x] **T03 Mission deck as linked pairs**
  Create `src/data/deck-basic.json` with this exact shape:
  ```
  { "pairs": [ { "pairId": "p01", "a": {"id":"...","text":"...","difficulty":1}, "b": {"id":"...","text":"...","difficulty":1}, "link": "..." } ],
    "solos": [ {"id":"...","text":"...","difficulty":1} ] }
  ```
  12 pairs and 6 solo missions, so 30 mission texts in total. In a pair, `a` and `b` must interlock: completing `a` requires `b`'s holder to act, without either of them knowing. `link` is the one-line explanation shown at reveal time, for example "은우가 칭찬을 하고, 지호가 그 칭찬을 들었습니다". Missions must be doable without alcohol, must not single out or embarrass anyone, and must not require physical contact. Copy stays in Korean.
  Tone examples for one pair: `a` = "오늘 안에 누군가에게 '너 진짜 대단하다'는 말을 듣기", `b` = "오늘 한 사람을 진심으로 칭찬하기".
  `Done when:` `node -e "const d=require('./src/data/deck-basic.json');if(d.pairs.length!==12)throw 1;if(d.solos.length!==6)throw 2;const ids=[...d.pairs.flatMap(p=>[p.a.id,p.b.id]),...d.solos.map(s=>s.id)];if(ids.length!==30)throw 3;if(new Set(ids).size!==30)throw 4;d.pairs.forEach(p=>{if(!p.link)throw 5})"` exits 0.

- [x] **T04 Paired assignment**
  Add `assign(names[], deck, seed)` in `src/lib/assign.ts`. It returns one entry per guest: `{name, mission, pairId | null, partnerIndex | null}`. Fill the party with whole pairs first, assigning `a` and `b` to two different guests. If the guest count is odd, exactly one guest receives a solo mission with `pairId: null`. If there are more guests than the deck supports, fall back to solo missions rather than failing. The same seed always produces the same assignment.
  `Done when:` `node --test tests/assign.test.mjs` passes, covering: 4 guests yields 2 complete pairs; 5 guests yields 2 pairs and 1 solo; 12 guests yields 6 pairs; no mission id repeats within a party; every non-null `pairId` appears exactly twice; the same seed reproduces the same result.

- [x] **T05 Host creation screen (evidence for B3)**
  On the home screen, the host enters a party name and guest names, and gets one link per guest, each with a copy button and an open-in-new-tab link, plus a copy-all button. With fewer than two guests the create button is disabled and the screen shows "미션나잇은 혼자서는 시작할 수 없습니다. 임무는 서로 맞물려 있습니다".
  `Done when:` `npm run build` passes and `node --test tests/link.test.mjs` passes, verifying that decoding a generated link hash yields that guest's name and mission **and contains no partner name, partner mission, or link text**.

- [x] **T06 Guest screen (judging step 2)**
  At `#/m/<payload>`, show the guest's name and their single mission as a card. Tapping "확인했어요" flips the card; it can be flipped back. Below the card, one line of copy hints that the mission may not be self-contained, without revealing anything: "이 임무는 당신 혼자만의 것이 아닐 수도 있습니다".
  `Done when:` `npm run build` passes and the payload type for this screen has no field carrying another guest's name, mission, or the pair link text.

- [x] **T07 Reveal screen with pair connection (judging step 3)**
  At `#/reveal/<payload>`, the host steps through guests one at a time, revealing each mission and recording success or failure. Going back one step is possible. When a guest is revealed whose partner has already been revealed, show a connecting treatment naming both guests and the pair's `link` line, headed "사실, 이 둘은 하나였습니다". A solo guest simply shows their verdict. After the last guest, navigate to the result screen automatically.
  **The connection display is presentational only.** If it cannot render for any reason, the reveal still advances and still reaches the result screen.
  `Done when:` `npm run build` passes, stepping through all four demo guests reaches the result screen, and `node --test tests/pairing.test.mjs` passes verifying that the connection is computed only after both members are revealed.

- [x] **T08 Result card, connection map and carry-over (evidence for B4)**
  Show success rate, the guest who cleared the highest difficulty, the list of failed missions, and a simple list of the pairs that completed, each rendered as "A ↔ B — <link line>". Below that:
  1. A copy button for a shareable result link (`#/result/...`), text only.
  2. A **"다음 파티에서 이어하기"** button that opens a new creation screen pre-filled with the same guest list, carrying this party's failed missions into the next pool and carrying the completed pairs forward as a short history (cap the history at the three most recent parties so the link stays short).
  `Done when:` `npm run build` passes and `node --test tests/result.test.mjs` passes, verifying the result encoding round trip, that carried-over missions appear in the next assignment, and that the history never exceeds three parties.

- [x] **T09 Demo mode (judging step 1, highest quality bar)**
  A large "5분 데모로 체험하기" button at the top of the home screen. Clicking it immediately creates a four-guest party (민서 / 지호 / 은우 / 하린) assigned as two complete pairs, and shows all four guest links on screen, openable in new tabs. No input of any kind is required. Every screen shows a one-line "what to do now / what happens next" hint at the top.
  `Done when:` `npm run build` passes and home → demo click → four links → guest screen → reveal screen → result screen is reachable without typing anything, and the demo party contains exactly two complete pairs.

- [x] **T10 Themed deck showcase (evidence for C1)**
  On the creation screen, below the free base deck, list four themed decks as locked cards, each with a name and the price 3,900원: 연말 파티덱, 신입 환영덱, 회식덱, 소개팅덱. Each card shows how many pairs it contains. Selecting one opens an inline notice reading "출시 예정입니다. 기본 덱으로 시작할 수 있어요" and the flow continues with the base deck. No payment integration.
  `Done when:` `npm run build` passes, the four deck names and the price string appear in the rendered creation screen, and selecting a locked deck does not block party creation.

- [x] **T11 Error and empty states (scored under A4)**
  Handle all of these: a corrupted or truncated link shows an explanation and a link home; the creation screen with zero guests shows guidance; the result screen with no result shows guidance; a party where no pair completed shows a specific empty state rather than a blank section. No route produces a white screen or a console error. Remove all dummy text.
  `Done when:` `npm run build` passes, `grep -rniE "lorem|TODO|placeholder" src/` returns nothing, and visiting `#/m/zzzz` renders the explanation screen.

- [x] **T12 Design pass**
  Dark background, one accent colour, large type. The mission card flips. The pair connection uses the accent colour and a drawn line between the two names. No horizontal scroll at 375px width. No emoji spam.
  `Done when:` `npm run build` passes and there is no horizontal scroll at 375px width.

- [x] **T13 README**
  At the top: the deployed URL, the demo instruction, and the **three** judging steps as a numbered list. Below that, three sections: `## For the founder judge`, `## For the engineer judge`, `## For the investor judge`. The engineer section explains the serverless architecture, the paired-assignment algorithm, and states that this repository was built by a Ralph loop, citing `progress.txt` and the commit log. At the bottom, a table mapping every completed PRD task to the file that implements it. **Do not write about any feature that is not implemented.** If T14 and T15 are unchecked, do not mention photos or recap anywhere.
  `Done when:` README.md contains all three section headings, lists exactly three judging steps, and the mapping table has one row per completed task.

---

### Optional extras. Only start these if every task above is `[x]`.

- [ ] **T14 Photo capture on reveal (optional)**
  On the reveal screen, after a verdict is recorded, offer "증거 사진 찍기" using a file input with `accept="image/*"` and `capture="environment"`. The image is held in memory as an object URL keyed to that guest, downscaled to at most 800px on the long edge via Canvas, shown as a thumbnail with a remove button. Also offer "샘플 사진 사용" attaching a bundled image from `src/assets/samples/`.
  **Skipping photos must change nothing else**, and the three judging steps must still pass untouched.
  `Done when:` `npm run build` passes, `src/assets/samples/` holds at least four images, and the full reveal flow with zero photos still reaches the result screen.

- [ ] **T15 Recap image (optional)**
  On the result card, add "리캡 이미지 저장" composing a single portrait PNG on a Canvas: party name and date, one row per guest with photo (or a neutral block), name, mission and verdict, and a marked connection between paired guests. Footer carries the product name. Downloads as `missionnight-recap.png`. In demo mode the bundled samples are pre-attached so a judge with no camera downloads a complete recap.
  `Done when:` `npm run build` passes, `node --test tests/recap.test.mjs` passes verifying a row per guest and the zero-photo case, and README has been updated to mention this feature.

## 5. Out of scope

Real-time sync, chat, photo upload to any server, cloud albums, social login, push notifications, internationalisation, payment integration. Photos are never transmitted anywhere.