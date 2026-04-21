# PROTOCOL_72

> 120-day strict health, diet, and skincare regimen tracker. Local-first PWA, installable, offline-capable.

---

## What's new in this build

**Phase A — dynamic meal picker + BMR-aware targets**

- **Intensity toggle in onboarding** — Standard (−500 kcal) or Aggressive (−750 kcal). Floors prevent dropping below safe minimums (1300 kcal male / 1100 kcal female on aggressive).
- **Dietary profile** — Non-veg / Eggitarian / Vegetarian / Vegan / Jain, plus no-onion-garlic and lactose-free toggles. Filters the whole meal library.
- **Indian meal library** — 119 items with kcal + protein. Per-slot preference hints (what's a breakfast vs. dinner item), dietary tags, portion sizes.
- **Per-slot meal picker** — FUEL tab now shows four cards (Morning / Lunch / Evening / Dinner), each with a kcal budget derived from the user's BMR. Tap `+ ADD ITEM` → bottom-sheet picker with search, FAV / RECENT / ALL tabs, strict-slot filter, star-to-favorite, and a "custom item" form with optional save-to-library.
- **Per-slot budgets** — default split 22 / 33 / 13 / 32% of daily kcal target, ±15% tolerance. Slot card left-border and bar change color as you fill up: green (in range) → amber (over) → red (way over).
- **Quantity steppers** — every logged item has ± 0.5 steppers so you can log ½ roti or 2× eggs without re-adding.
- **Android haptic feedback** — tiny buzz on add / stepper actions. No-op on iOS (Apple blocks the Vibration API for PWAs; fix migrates automatically if wrapped in Capacitor).
- **New 25-point compliance rubric** — 7 skin + 4 slot-kcal + 3 slots-logged + 3 protein tiers + 2 flags + 5 metrics + 1 workout. Goal-aware, not tick-counting.
- **Protein from meals** — automatically summed from logged items. The LOG-tab "Protein" input is now for supplements / extras only (shows how many grams came from meals right in the label).
- **Store migration v2 → v3** — existing users' 120-day history is preserved. Legacy boolean meal checkboxes are converted into the new slot-array shape using a mapping table so past compliance scores still make sense.

**Phase A carries over from previous builds:**

- Welcome / onboarding flow (name, sex, DOB, height, starting weight, goal weight, smoking baseline, activity level)
- Explicit START PROTOCOL — today or tomorrow as Day 1 with midnight countdown
- Apple Health step-count import (Health Auto Export JSON or raw Apple Health XML)
- Forgiveness mechanic — 2 free misses per rolling 28-day window preserve the streak
- Personalized kcal window + profile-based weight delta
- Menu: RESTART SETUP (soft reset keeps logged days)

---

## Stack

| Concern | Choice |
|---|---|
| Build | Vite 5 |
| UI | React 18 |
| State | Zustand + `persist` middleware (LocalStorage) |
| Gestures | Framer Motion |
| PWA | `vite-plugin-pwa` (auto-update, runtime caching) |
| Styling | Plain CSS, brutalist design tokens |
| Fonts | JetBrains Mono (self-hostable) |

Zero backend. All state is client-side, persisted to `localStorage` under key `protocol72_store_v1`. Export → JSON for backup. Import → restore.

---

## Run

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # output → dist/
npm run preview     # serve dist/
```

PWA install is available from the build (or preview) — not from dev. To test offline:

```bash
npm run build && npm run preview
```

Then Chrome → DevTools → Application → Service Workers → "Offline".

---

## Directory

```
/src
├── components/
│   ├── ui/              Checkbox · NumericInput · Button · SwipeRow · Toast
│   ├── skincare/        AmRoutine · PmRoutine · SkincareView
│   ├── diet/            MealTracker · DietFlags · FuelView
│   ├── metrics/         BodyMetrics · ActivityToggles · LogView
│   ├── visualizations/  TransformationMatrix · DataCharts · ComplianceRing
│   │                    StatGrid · MilestoneTimeline · DashView
│   └── layout/          TopBar · BottomNav · DayRecapModal
├── store/               useAppStore.js
├── utils/               constants.js · dates.js · scoring.js
├── styles/              global.css
├── App.jsx
└── main.jsx
```

---

## Architecture notes

**State shape.** One store, one day-map keyed by `YYYY-MM-DD`. Each day has `skin`, `meals`, `flags`, `metrics`, `activity`. See `utils/scoring.js → blankDay()`.

**Midnight rollover.** `App.jsx` schedules a `setTimeout` for the next midnight boundary, plus listeners on `visibilitychange` + `focus`. On fire, `rolloverIfNeeded` updates `activeDay` to today's key. Previous days remain queryable via `days[key]`.

**Compliance scoring.** 25-point rubric in `scoring.js::scoreDay`: 7 skincare, 10 meals, 3 flags, 4 metrics (steps ≥ 8k, sleep ≥ 7h, smoke = 0, weight logged), 1 workout. Percentage drives color tiers on the 120-cell matrix.

**Night routine logic.** `nightRecommendation()` looks back 7 days, counts retinoid applications, enforces the 3×/week cap, and suggests niacinamide on rest days. Surfaces inline under the PM tab switcher.

**Swipe gestures.** `SwipeRow` wraps any content in a `motion.div` with horizontal drag. ±80px threshold → complete / miss. Neon-green or red background reveal, row flash on release, auto-spring back to center. Disabled via media query above 900px.

**120-day matrix.** GitHub-contributions-style grid, 18 columns × 7 rows. Horizontally scrollable with scroll-snap, auto-centers today on mount. Click any cell → `DayRecapModal` (portal-rendered, full day stats).

**PWA.** `vite-plugin-pwa` emits a service worker that precaches built assets + runtime-caches Google Fonts. Auto-update with in-app toast on new SW. Manifest supplies icons, theme color, standalone display.

---

## Design tokens

| Token | Value |
|---|---|
| `--bg` | `#0a0a0a` |
| `--bg-panel` | `#111111` |
| `--ok` | `#39ff14` |
| `--bad` | `#ff003c` |
| `--warn` | `#ffcc00` |
| `--info` | `#00e5ff` |
| `--mono` | JetBrains Mono |

Zero rounded corners. Zero shadows. Hierarchy via `1px solid var(--line)` borders. Monospace throughout. Two weights on screen: 400 and 900.

---

## Keyboard

| Action | Key |
|---|---|
| Close recap modal | Esc |
| Toggle a checkbox (focused) | Space / Enter |

---

## Backup

Header → menu → EXPORT JSON. File is `protocol72_YYYY-MM-DD.json` containing `{ version, exportedAt, start, days }`. Import overwrites all current state (confirmation required).

---

## License

Private. Fork if you want, no warranty.
