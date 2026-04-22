# Kana SRS — Design Document

> A personal PWA for learning hiragana and katakana via typed-romaji recognition, powered by a Leitner spaced-repetition engine.

---

## 1. Understanding Summary

- **What:** A PWA for learning hiragana and katakana via typed-romaji recognition, powered by a Leitner spaced-repetition engine, with audio feedback on reveal, progress stats, and optional Gist-based backup.
- **Why:** Learn 142 characters (base + dakuten/handakuten) over 4–6 weeks via ~15–20 min daily sessions, with memory that actually sticks.
- **Who:** Single user, complete beginner to kana, Android as primary device.
- **How deployed:** GitHub Pages, HTTPS, "Add to Home Screen" on Android. Offline after first load.
- **Data:** Lives in IndexedDB on-device. Backup via manual JSON export/import + optional auto-sync to a private GitHub Gist.
- **Non-goals (explicit):** Not a product for others, no accounts/auth, no handwriting or stroke-order, no kanji/vocab/grammar, no production mode (romaji → kana), no daily push notifications. Yōon combos deferred to Phase 2.

---

## 2. Assumptions

1. **Card scope = 142** (46 hiragana + 46 katakana + ~50 dakuten/handakuten).
2. **Audio** via Web Speech API `ja-JP` voice. No hosted MP3s. Quality depends on device's installed voices; Android ships reasonable defaults.
3. **Storage** = IndexedDB (via Dexie). More robust than localStorage, higher quota, handles JSON natively.
4. **Romanization** = accept both Hepburn (`shi`, `tsu`, `fu`) and Nihon-shiki (`si`, `tu`, `hu`) for ambiguous characters. Exact match otherwise. No typo forgiveness in v1.
5. **Leitner intervals** = 1d → 2d → 4d → 8d → 16d. Leech threshold = 3 consecutive misses.
6. **Session end** = when all due cards are done (+ up to 7 new if review load < 15 due).
7. **Gist token** stored locally only, never transmitted except to `api.github.com`.

---

## 3. Final Decision Log

| # | Decision | Rejected | Rationale |
|---|---|---|---|
| 1 | Personal single-user tool | Multi-user product | Learning aid, not a product. No auth, no privacy overhead. |
| 2 | Recognition only (kana → romaji) | Production / handwriting / stroke order | Massively simpler; other skills can come later. |
| 3 | Typed romaji input | Multiple choice / flip-card self-grade | Strictest real recall. Binary grading = simple SRS. |
| 4 | 142 cards (base + dakuten) | 92 / 204 | Fits 4–6 weeks; yōon is a distinct skill → Phase 2. |
| 5 | PWA on GitHub Pages | Capacitor APK / native Kotlin | Free hosting, fastest iteration, trivially updatable. |
| 6 | Leitner + leech detection | SM-2 / FSRS | Binary input + 142 cards → simpler wins. Debuggable by eye. |
| 7 | Adaptive new-card pacing (≤7/day, gated by load <15) | Fixed 5/day / user slider | Adapts to bad days. No extra UI. |
| 8 | Minimal new-card intro | Audio / mnemonics / batch | Simplest UX. Revisit if cold recall too hard. |
| 9 | Vite + React + TS + Tailwind | Svelte / Vanilla | Existing stack fluency > bundle size. |
| 10 | Dexie for IndexedDB | Raw IDB / localStorage | Migrations + `liveQuery` + tiny. |
| 11 | Web Speech API audio | Hosted MP3s | Zero bundle bloat. Works offline after voice loads. |
| 12 | Manual JSON + optional Gist sync | No backup / hosted DB | Defense-in-depth; no infrastructure. |
| 13 | Pure SRS engine module | Logic inside components | Unit-testable, portable. |

---

## 4. Architecture & Module Layout

Client-side only. No backend. Optional Gist sync talks directly to `api.github.com` from the browser. The SRS engine is a *pure* module (no React, no IndexedDB) — testable as a plain function.

```
/src
├── data/
│   ├── kana.ts          # static: 142 cards, metadata (kind, group)
│   └── db.ts            # Dexie setup, schema, migrations
├── srs/
│   └── leitner.ts       # pure engine: nextState(card, correct) → card
├── lib/
│   ├── romaji.ts        # Hepburn/Nihon-shiki match logic
│   └── speech.ts        # Web Speech API wrapper
├── backup/
│   ├── json.ts          # export/import file
│   └── gist.ts          # GitHub Gist API sync
├── hooks/
│   ├── useSession.ts    # session state machine
│   └── useDueCards.ts   # reactive due-cards query
├── components/
│   ├── QuizCard.tsx
│   ├── NewCardIntro.tsx
│   ├── SessionSummary.tsx
│   ├── StatsDashboard.tsx
│   └── Settings.tsx
├── App.tsx              # routing (4 routes)
└── main.tsx             # entrypoint + SW registration
```

### Architectural principles

1. **Pure SRS engine.** `leitner.ts` takes state, returns new state. No side effects.
2. **Dexie as the storage boundary.** All persistence flows through `db.ts`.
3. **Dumb components.** Logic lives in hooks; state machines in hooks; UI just renders.
4. **No global store library.** Zustand/Redux overkill. React Context + hooks for session state; Dexie's `useLiveQuery` for reactive card data.

Routes (react-router): `/` (home/today), `/session`, `/stats`, `/settings`.

---

## 5. Data Model

### Dexie schema

```ts
export interface Card {
  id: string;              // e.g., "hira-a", "kata-ka", "hira-ga"
  kind: 'hiragana' | 'katakana';
  group: 'base' | 'dakuten' | 'handakuten';
  glyph: string;           // あ
  romaji: string[];        // ['a'] or ['shi','si'] for ambiguous
  box: 0 | 1 | 2 | 3 | 4 | 5;  // 0 = new/unseen, 1-5 = Leitner boxes
  dueAt: number | null;    // epoch ms; null if new
  lastSeenAt: number | null;
  correctCount: number;
  incorrectCount: number;
  consecutiveMisses: number;
  isLeech: boolean;
}

export interface ReviewLog {
  id?: number;             // autoincrement
  cardId: string;
  ts: number;
  correct: boolean;
  responseMs: number;
  typedAnswer: string;
}

export interface Settings {
  id: 'singleton';
  newCardsPerDay: 7;
  reviewLoadThreshold: 15;
  gistSync: { enabled: boolean; token?: string; gistId?: string; lastSync?: number };
  streakCount: number;
  lastStudyDate: string;   // YYYY-MM-DD local
}
```

### Notes

- `romaji: string[]` handles Hepburn/Nihon-shiki ambiguity cleanly. Match is `card.romaji.includes(input.trim().toLowerCase())`.
- `ReviewLog` is append-only. Powers stats and debugging without polluting card state.
- Schema version tracked in Dexie for future migrations.

---

## 6. SRS Engine (Leitner + Leech Detection)

```ts
const INTERVALS_DAYS = [1, 2, 4, 8, 16]; // box 1..5
const LEECH_THRESHOLD = 3;

export function nextState(card: Card, correct: boolean, now: number): Card {
  if (correct) {
    const newBox = Math.min(5, card.box + 1) as Card['box'];
    return {
      ...card,
      box: newBox,
      dueAt: now + INTERVALS_DAYS[newBox - 1] * 86_400_000,
      lastSeenAt: now,
      correctCount: card.correctCount + 1,
      consecutiveMisses: 0,
    };
  } else {
    const consecutive = card.consecutiveMisses + 1;
    return {
      ...card,
      box: 1,
      dueAt: now + INTERVALS_DAYS[0] * 86_400_000,
      lastSeenAt: now,
      incorrectCount: card.incorrectCount + 1,
      consecutiveMisses: consecutive,
      isLeech: consecutive >= LEECH_THRESHOLD ? true : card.isLeech,
    };
  }
}
```

### Behavior

- Correct → promote to next box (cap at 5), reset consecutive misses.
- Incorrect → back to box 1, increment consecutive misses.
- Leech flag latches once set. Card stays in rotation; flag surfaces in stats so you can see what's tripping you up.

---

## 7. Session Flow & State Machine

### Queue construction (on session start)

```
1. Query due cards: dueAt <= now AND box >= 1
2. If due.length < reviewLoadThreshold (15):
     budget = min(newCardsPerDay (7), reviewLoadThreshold - due.length)
     new_cards = take `budget` cards where box === 0
   else:
     new_cards = []
3. queue = shuffle(due) + shuffle(new_cards)
   (reviews first, new cards at end — avoids intro fatigue mid-session)
4. Leech cards re-inserted 2 positions later if missed (forced repeat within session)
```

### State machine

```
LOADING → PICK_NEXT → (is new?) → INTRO_NEW → PROMPT
                    ↓ (not new)
                    PROMPT → GRADE → REVEAL → (queue not empty) → PICK_NEXT
                                                ↓ (queue empty)
                                                SUMMARY
```

### Interaction details

- **Input:** `<input inputMode="latin" autoCapitalize="off" autoCorrect="off" spellCheck={false}>`. Critical on mobile — otherwise romaji gets mangled.
- **Submit:** Enter key on keyboard. No explicit submit button.
- **Grading:** case-insensitive, trimmed. `card.romaji.includes(input.trim().toLowerCase())`.
- **Reveal:** glyph shrinks up, romaji appears below in bold green/red, audio plays. Auto-advance after ~1.2s.
- **Typo tolerance:** none in v1. If frustrating, add Levenshtein ≤ 1 later.

---

## 8. Backup & Sync Design

### Two independent mechanisms

**Manual JSON export/import** (primary, always works)
- "Export progress" → downloads `kana-srs-backup-YYYY-MM-DD.json`
- Payload: `{cards, logs, settings, schemaVersion}`
- "Import progress" → file picker → schema-version check → atomic replace in single Dexie transaction
- Round-trip lossless.

**Auto-sync to private GitHub Gist** (optional)
- Setup: user pastes a GitHub PAT with `gist` scope only. App creates a private gist on first sync, stores `gistId`.
- Triggers: after session end; on cold start if `lastSync > 1h ago`.
- Payload: same JSON shape as manual export.
- Conflict resolution: last-write-wins by `lastSync` timestamp. If remote newer on cold start, prompt: "Remote is newer — pull and replace?"
- Token stored in IndexedDB only. Never logged, never transmitted except to `api.github.com`.

---

## 9. Error Handling Matrix

| Failure | Detection | Response |
|---|---|---|
| IndexedDB unavailable | `Dexie.open()` throws | Full-screen error. No partial state. |
| Service worker registration fails | `navigator.serviceWorker.register` rejects | Console warn. App still works, just not offline on reload. |
| Web Speech API missing `ja-JP` | `getVoices()` filtered empty | Hide speaker button. Log once. Continue silently. |
| Gist API 401/403 | fetch response | Toast + settings deep-link. Sync disabled until token reset. |
| Gist API network failure | fetch rejects | Silent retry w/ backoff (1s, 5s, 30s). After 3 fails, give up until next trigger. |
| Import schema mismatch | `schemaVersion` check | Modal. Never partial-apply. |
| Empty deck on first run | Dexie count === 0 | Auto-seed from `kana.ts`. |

### Edge cases

- **Clock changes (travel, DST):** `dueAt` is UTC epoch ms; intervals survive timezone shifts. Streak uses local date — accept minor oddities across travel.
- **Multiple tabs open:** Dexie's `liveQuery` keeps both in sync automatically.
- **Cold start:** PWA shell <100ms from cache; Dexie open + query ≈ 20–50ms on Android.

---

## 10. Testing Strategy

### Unit tests (required)

Using **Vitest** (native Vite integration).

- `leitner.ts`: every `nextState` branch — correct box 1→2, 5→5 cap, incorrect reset, leech trigger, leech persistence. ~15 cases.
- `romaji.ts`: Hepburn/Nihon-shiki for all ambiguous characters (し, つ, ち, ふ, じ, etc.). Case and trim handling.
- `json.ts`: round-trip property test: `export → import → deep-equal original`.

### Integration tests (optional)

- Session queue construction across review-load scenarios.
- Dexie migration forward paths (stub for v2+).

### Manual acceptance (before trusting v1)

- [ ] Install as PWA on Android (Chrome → Add to Home Screen).
- [ ] Airplane mode → app opens, session runs, data persists.
- [ ] Session → force-close → reopen → state intact.
- [ ] Export JSON → wipe site data → import JSON → state restored identically.
- [ ] Gist sync setup → session → verify gist contents match local export.

---

## 11. Out of Scope (v1)

- E2E tests (Playwright/Cypress)
- Accessibility beyond basics (keyboard nav + reasonable contrast)
- i18n
- Analytics
- Login / cloud accounts / multi-user
- Production mode (romaji → kana)
- Handwriting / stroke order
- Yōon combos (Phase 2)
- Kanji, vocab, grammar
- Push notifications

---

## 12. Implementation Plan

Ordered for fastest path to daily usability. After Phase 2 you can start using the app; everything else is additive.

### Phase 0 — Scaffolding · **2–4 hrs**

- [ ] `npm create vite@latest kana-srs -- --template react-ts`
- [ ] Install & configure Tailwind
- [ ] Install `vite-plugin-pwa` + configure `manifest.json` (name, icons, theme color, display: standalone)
- [ ] Install `dexie`, `dexie-react-hooks`, `react-router-dom`
- [ ] Create GitHub repo, push
- [ ] Add `.github/workflows/deploy.yml` → build on push to `main`, publish `dist/` to Pages
- [ ] Verify: "hello world" PWA loads on Android, installs to home screen, works offline
- [ ] Set up Vitest

**Exit:** deploy pipeline works end-to-end.

### Phase 1 — Data layer + SRS engine · **3–5 hrs**

- [ ] Define TS interfaces (`Card`, `ReviewLog`, `Settings`)
- [ ] Write `data/kana.ts` — all 142 cards with `romaji` arrays (handle ambiguous chars)
- [ ] Dexie setup in `data/db.ts` — schema, indexes (`dueAt`, `box`), seed logic on empty
- [ ] Implement `srs/leitner.ts` `nextState` function
- [ ] Write unit tests for `leitner.ts` (all branches)
- [ ] Implement `lib/romaji.ts` matcher + unit tests

**Exit:** `npm test` green. SRS engine correct.

### Phase 2 — Core session flow · **4–6 hrs**

- [ ] `hooks/useDueCards.ts` — reactive query via `useLiveQuery`
- [ ] `hooks/useSession.ts` — state machine (LOADING → PICK_NEXT → INTRO_NEW / PROMPT → GRADE → REVEAL → SUMMARY)
- [ ] `components/NewCardIntro.tsx` — minimal intro screen
- [ ] `components/QuizCard.tsx` — prompt + input + reveal animation
- [ ] `components/SessionSummary.tsx` — done screen
- [ ] Home screen (`/`) — "X cards due, Y new available. Start session."
- [ ] Wire routes, persist state transitions through Dexie writes

**Exit:** you can do a full daily session on your phone. App is minimally usable.

### Phase 3 — Audio · **1–2 hrs**

- [ ] `lib/speech.ts` — detect `ja-JP` voice, speak on demand, graceful no-op if absent
- [ ] Integrate into `QuizCard` reveal phase
- [ ] Manual test across device voices

**Exit:** reveal plays the correct sound. Works offline once voice loaded.

### Phase 4 — Manual backup · **2–3 hrs** · *do this BEFORE polish*

- [ ] `backup/json.ts` — export (`serialize → Blob → download`), import (`file → parse → version-check → transaction`)
- [ ] Settings page UI for export/import buttons
- [ ] Schema-version constant in exports

**Exit:** round-trip backup works. You can now risk the rest without fear of data loss.

### Phase 5 — Stats dashboard · **2–3 hrs**

- [ ] Cards mastered count (box 5)
- [ ] Box distribution bar viz (custom, no chart lib needed)
- [ ] Streak calculation (daily study detection via `lastStudyDate`)
- [ ] Total reviews, accuracy %, leech list

**Exit:** satisfying progress screen. Motivation layer in place.

### Phase 6 — Gist sync · **3–5 hrs**

- [ ] Settings UI for PAT entry (with warning about token scope)
- [ ] `backup/gist.ts` — create gist, update gist, fetch gist
- [ ] First-sync flow: create → store `gistId`
- [ ] Auto-sync triggers (session end, cold start + >1h)
- [ ] Conflict prompt on cold-start pull
- [ ] Error toasts + exponential backoff

**Exit:** zero-effort backup working.

### Phase 7 — Polish · **2–4 hrs**

- [ ] PWA install prompt UX (the `beforeinstallprompt` event)
- [ ] Small animations (card reveal, correctness flash)
- [ ] Favicon + proper PWA icons (192, 512 px)
- [ ] Offline test pass
- [ ] Run the full manual acceptance checklist

**Exit:** v1 done.

---

### Rough total: **19–32 hrs**

Over a few weekends or spread across evenings. Phases 0–4 (≈12–20 hrs) get you to a usable, safely-backed-up app. Phases 5–7 are quality-of-life.

### Critical path

```
Phase 0 → Phase 1 → Phase 2 → [USABLE] → Phase 4 → [SAFE]
                                      ↓
                            (3, 5, 6, 7 in any order)
```

### Risks to watch

- **`ja-JP` voice availability** on your specific Android — test early (Phase 3). If missing, either accept silent mode or pre-record 142 short WAVs (adds ~1 MB to bundle, tolerable but breaks "zero hosting" vibe slightly).
- **Mobile keyboard weirdness** — auto-correct, auto-capitalization, next-word suggestions. Test on your real phone during Phase 2; the input attributes listed in §7 are necessary but may not be sufficient.
- **Gist rate limits** — GitHub unauthenticated: 60/hr; authenticated: 5000/hr. You'll be fine, but note the 10MB gist size cap (your data is <100KB, so no concern).

---

*Design locked on 2026-04-22. Revisit if Phase 2 takes wildly longer than estimated — that's the signal something in the spec is wrong.*
