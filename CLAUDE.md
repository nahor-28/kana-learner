# Kana SRS — CLAUDE.md (SSOT)

> Single source of truth for building and maintaining this project. Keep this file updated when any architectural decision changes.

---

## Project Overview

A personal PWA for learning hiragana and katakana via typed-romaji recognition, powered by a Leitner spaced-repetition engine.

- **Target user:** Single user, complete beginner to kana, Android as primary device
- **Deployment:** GitHub Pages (HTTPS), "Add to Home Screen" as PWA
- **Offline:** Full offline support after first load via service worker
- **Data:** IndexedDB (Dexie). No backend. Optional Gist backup.

---

## Tech Stack (exact versions)

| Package | Version |
|---------|---------|
| react | ^19.2.5 |
| react-dom | ^19.2.5 |
| react-router-dom | ^7.14.2 |
| dexie | ^4.4.2 |
| dexie-react-hooks | ^4.4.0 |
| vite | ^8.0.9 |
| @vitejs/plugin-react | ^6.0.1 |
| typescript | ^6.0.3 |
| tailwindcss | ^4.2.4 |
| @tailwindcss/vite | ^4.2.4 |
| vite-plugin-pwa | ^1.2.0 |
| vitest | ^4.1.5 |
| @types/react | ^19.2.14 |
| @types/react-dom | ^19.2.3 |

---

## Project Structure

```
kana-srs/
├── CLAUDE.md                        ← this file
├── index.html
├── vite.config.ts                   ← react + tailwind + pwa plugins
├── tsconfig.json                    ← strict mode
├── public/
│   ├── manifest.json                ← PWA manifest
│   └── icons/                       ← 192.png, 512.png
├── src/
│   ├── main.tsx                     ← entry + SW registration
│   ├── App.tsx                      ← react-router routes (/, /session, /study, /stats, /settings)
│   ├── data/
│   │   ├── kana.ts                  ← KANA_CARDS: Card[] — all 142 static cards
│   │   └── db.ts                    ← Dexie schema v1, filterCardsByScope(), seedCards()
│   ├── srs/
│   │   └── leitner.ts               ← pure nextState(card, correct, now): Card
│   ├── lib/
│   │   ├── romaji.ts                ← matches(card, input): boolean
│   │   └── speech.ts                ← speak(text): void — Web Speech API wrapper
│   ├── backup/
│   │   ├── json.ts                  ← exportData(), importData(file)
│   │   └── gist.ts                  ← syncToGist(), fetchFromGist()
│   ├── hooks/
│   │   ├── useSession.ts            ← session state machine
│   │   └── useDueCards.ts           ← reactive due-cards + new-card count
│   ├── components/
│   │   ├── Onboarding.tsx           ← first-run: name input + deck scope selection
│   │   ├── QuizCard.tsx             ← glyph display + romaji input + reveal
│   │   ├── NewCardIntro.tsx         ← intro screen before first prompt of a new card
│   │   ├── SessionSummary.tsx       ← session done: correct/total, accuracy, leeches
│   │   ├── StatsDashboard.tsx       ← box distribution, streak, mastered, leech list
│   │   ├── StudyGrid.tsx            ← grid renderer used by Study.tsx (per-tab)
│   │   └── Settings.tsx             ← export/import, Gist PAT, scope change
│   └── pages/
│       ├── Home.tsx                 ← "/" — due count, new available, start + study buttons
│       ├── Session.tsx              ← "/session" — wraps useSession + components
│       ├── Stats.tsx                ← "/stats" — wraps StatsDashboard
│       ├── Study.tsx                ← "/study" — browsable reference, tabs, no-look toggle
│       └── SettingsPage.tsx         ← "/settings" — wraps Settings
└── src/__tests__/
    ├── leitner.test.ts
    ├── romaji.test.ts
    ├── json.test.ts
    └── onboarding.test.ts
```

---

## Data Model

```ts
export interface Card {
  id: string;              // e.g. "hira-a", "kata-ka", "hira-ga"
  kind: 'hiragana' | 'katakana';
  group: 'base' | 'dakuten' | 'handakuten';
  glyph: string;           // あ
  romaji: string[];        // ['a'] or ['shi','si'] for ambiguous
  box: 0 | 1 | 2 | 3 | 4 | 5;  // 0 = new/unseen
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
  userName: string;
  deckScope: 'hiragana-basic' | 'katakana-basic' | 'hiragana-all' | 'katakana-all' | 'both-all';
  newCardsPerDay: number;          // default 7
  reviewLoadThreshold: number;     // default 15
  gistSync: { enabled: boolean; token?: string; gistId?: string; lastSync?: number };
  streakCount: number;
  lastStudyDate: string;           // YYYY-MM-DD local
}
```

### Dexie schema (v1)

```ts
db.version(1).stores({
  cards: 'id, box, dueAt, kind, group',
  logs: '++id, cardId, ts',
  settings: 'id'
});
```

---

## SRS Engine (`src/srs/leitner.ts`)

```ts
const INTERVALS_DAYS = [1, 2, 4, 8, 16]; // box 1..5
const LEECH_THRESHOLD = 3;

export function nextState(card: Card, correct: boolean, now: number): Card
```

**Behaviour:**
- **Correct** → `box = min(5, box + 1)`, `dueAt = now + INTERVALS_DAYS[newBox-1] * 86_400_000`, `consecutiveMisses = 0`, `correctCount++`
- **Incorrect** → `box = 1`, `dueAt = now + 1 * 86_400_000`, `consecutiveMisses++`, `incorrectCount++`
- **Leech** → `isLeech = true` when `consecutiveMisses >= 3`. Flag latches — never cleared automatically.

---

## Session Flow

### Queue construction

```
1. due   = cards where dueAt <= now AND box >= 1
2. if due.length < 15:
     budget   = min(7, 15 - due.length)
     newCards = take `budget` from cards where box === 0
   else:
     newCards = []
3. queue = shuffle(due) + shuffle(newCards)
4. missed leech → re-insert 2 positions ahead
```

### State machine

```
LOADING → PICK_NEXT → (new card?) → INTRO_NEW → PROMPT
                    ↓ (existing)
                    PROMPT → GRADE → REVEAL → PICK_NEXT
                                              ↓ (empty)
                                              SUMMARY
```

---

## Study Page (`/study`)

A browsable, read-only reference of all kana in the user's current deck scope. No SRS interaction.

**Tabs** (local state, resets on mount):

| Tab | Filter |
|-----|--------|
| Hiragana | `kind === 'hiragana' && group === 'base'` |
| Katakana | `kind === 'katakana' && group === 'base'` |
| Dakuten | `group === 'dakuten' \|\| group === 'handakuten'` (both kinds) |

**Hide romaji toggle** — local `boolean` state, defaults to `false` on every mount. Never persisted to Dexie. When `true`, the romaji text is rendered with `opacity: 0` (space reserved) so toggling causes no layout shift.

**Empty state** — when a tab filter yields zero cards (e.g., scope is `hiragana-basic` and user opens Katakana tab): show "Not in your current deck. Change scope in Settings." with a link to `/settings`.

**Data source** — `useLiveQuery` reads `db.cards`, then intersects with `filterCardsByScope(settings.deckScope)` from `kana.ts`. Reads only; never writes.

**Components involved:** `Study.tsx` (page, logic), `StudyGrid.tsx` (pure grid renderer).

---

## Onboarding (first-run)

Shown when `settings.userName` is absent (no Settings row in Dexie).

**Step 1 — Name:** free text input, stored in `settings.userName`.

**Step 2 — Deck scope:** radio selection, stored in `settings.deckScope`.

| Scope option | Cards seeded |
|---|---|
| `hiragana-basic` | kind=hiragana, group=base → 46 cards |
| `katakana-basic` | kind=katakana, group=base → 46 cards |
| `hiragana-all` | kind=hiragana → ~71 cards |
| `katakana-all` | kind=katakana → ~71 cards |
| `both-all` | all → 142 cards (default) |

**Re-seed rule:** changing scope in Settings adds missing cards but never deletes reviewed cards.

---

## Romaji Matching (`src/lib/romaji.ts`)

```ts
export function matches(card: Card, input: string): boolean {
  return card.romaji.includes(input.trim().toLowerCase());
}
```

### Ambiguous character romaji arrays

| Glyph | Hiragana | Katakana | romaji array |
|-------|---------|---------|-------------|
| し/シ | し | シ | `['shi', 'si']` |
| つ/ツ | つ | ツ | `['tsu', 'tu']` |
| ち/チ | ち | チ | `['chi', 'ti']` |
| ふ/フ | ふ | フ | `['fu', 'hu']` |
| じ/ジ | じ | ジ | `['ji', 'zi']` |
| ず/ズ | ず | ズ | `['zu', 'du']` |
| づ/ヅ | づ | ヅ | `['du', 'zu']` |

---

## Critical Mobile Input Attributes

Always use these on the romaji `<input>`:

```tsx
<input
  inputMode="latin"
  autoCapitalize="off"
  autoCorrect="off"
  spellCheck={false}
  autoComplete="off"
/>
```

Submit on Enter key only. No submit button.

---

## Backup Design

### Manual JSON (`src/backup/json.ts`)

Export payload shape:
```ts
{ schemaVersion: 1, exportedAt: number, cards: Card[], logs: ReviewLog[], settings: Settings }
```
- `exportData()` → Blob download as `kana-srs-backup-YYYY-MM-DD.json`
- `importData(file)` → parse → check `schemaVersion === 1` → atomic Dexie transaction

### Gist sync (`src/backup/gist.ts`)

- Same JSON shape as manual export
- Triggers: after session end; on cold start if `lastSync > 1h ago`
- Conflict: compare `lastSync` timestamps; if remote newer, prompt user
- Token in IndexedDB only, transmitted only to `api.github.com`
- Retry: exponential backoff 1s → 5s → 30s, give up after 3 failures

---

## Error Handling

| Failure | Response |
|---------|----------|
| IndexedDB unavailable | Full-screen error. No partial state. |
| SW registration fails | Console warn. App still works, not offline on reload. |
| No `ja-JP` voice | Hide speaker button. Log once. Continue silently. |
| Gist 401/403 | Toast + settings deep-link. Sync disabled until token reset. |
| Gist network failure | Silent retry w/ backoff. Give up after 3 fails. |
| Import schema mismatch | Modal error. Never partial-apply. |
| Empty deck on first run | Show onboarding wizard → seed from kana.ts. |

---

## Test Commands

```bash
cd kana-srs
npm test              # vitest run
npm run test:watch    # vitest watch
npm run dev           # dev server at localhost:5173
npm run build         # production build → dist/
npm run preview       # preview dist/
```

---

## Out of Scope (v1)

- E2E tests (Playwright/Cypress)
- Accessibility beyond basics
- i18n
- Analytics
- Login / cloud accounts / multi-user
- Production mode (romaji → kana)
- Handwriting / stroke order
- Yōon combos (Phase 2)
- Kanji, vocab, grammar
- Push notifications
- Typo forgiveness (Levenshtein) — v2 candidate

---

## Architecture Principles

1. **Pure SRS engine.** `leitner.ts` takes state, returns new state. No side effects. Fully unit-testable.
2. **Dexie as the storage boundary.** All persistence flows through `db.ts`.
3. **Dumb components.** Logic lives in hooks; UI just renders.
4. **No global store library.** React Context + hooks for session state; Dexie `useLiveQuery` for reactive card data.
5. **`filterCardsByScope` is exported from `db.ts`** so tests can call it without Dexie.
