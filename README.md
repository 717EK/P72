# PROTOCOL_72

> 120-day strict health, diet, and skincare regimen tracker. Local-first PWA, installable, offline-capable.

---

## What's new in this build

- **Welcome / onboarding flow** — collects name, sex, DOB, height, starting weight, goal weight (default 72 kg, editable), smoking baseline, and activity level. Derives BMR, TDEE, a personalized calorie window (~500 kcal deficit, floored at 1200/1400), and a protein target (1.8 g/kg).
- **Explicit START PROTOCOL** — user picks today or tomorrow as Day 1. Tomorrow is the default and shows a countdown screen until midnight. Day number is 0 until the protocol starts.
- **Apple Health import** — PWAs can't read HealthKit directly. The LOG tab has a sync panel that accepts two file formats: JSON from the *Health Auto Export* iOS app, or `export.xml` from Apple's built-in Health data export. Imported step counts only overwrite logged values that are lower.
- **Protein as grams, not a flag** — the `Hit protein ≥120g` checkbox is replaced by a number input. The 1/25 score point for protein is still awarded, auto-derived from grams vs. target.
- **Forgiveness mechanic** — the streak counter now allows 2 missed days per rolling 28-day window before breaking. The DASH shows a `SAVES LEFT 28D` stat alongside streak.
- **Personalized kcal window + weight Δ** — DASH stats now reflect the user's own calorie target and use profile starting weight for weight delta.
- **Menu: RESTART SETUP** — soft reset that clears profile + start date but keeps logged days. Separate from WIPE ALL.

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
