import { METRIC_TARGETS } from './constants';
import { addDays, dateKey, parseKey, daysBetween } from './dates';

// ---------- Day shape ----------
// meals is now an object of slot → item[]: { M: [{id,name,kcal,p,qty}], L: [...], E: [], D: [] }
// flags is now only zeroSugar + zeroOil (proteinHit retired; protein scored from meal data)
// metrics adds `proteinG` (optional manual top-up) and `mood` (1–5, unused in scoring yet)
export const blankDay = () => ({
  skin: {
    am: { wash: false, vitc: false, moist: false, spf: false },
    pm: { cleanse: false, active: false, moist: false },
    nightType: 'niacinamide'
  },
  meals: { M: [], L: [], E: [], D: [] },
  flags: { zeroSugar: false, zeroOil: false },
  metrics: { weight: null, steps: null, sleep: null, water: null, smoke: null, proteinG: null },
  activity: { workout: false, cardio: false, stretch: false },
  note: ''
});

export const mergeDay = (base, src) => {
  if (!src) return base;
  const out = JSON.parse(JSON.stringify(base));
  for (const group of Object.keys(src)) {
    const v = src[group];
    if (v == null) continue;
    if (Array.isArray(v)) {
      out[group] = v.slice();
    } else if (typeof v === 'object') {
      // Special-case meals: preserve arrays, not merge them element-wise.
      if (group === 'meals') {
        out.meals = {};
        for (const k of Object.keys(v)) {
          out.meals[k] = Array.isArray(v[k]) ? v[k].slice() : [];
        }
      } else {
        out[group] = { ...(out[group] || {}), ...v };
      }
    } else {
      out[group] = v;
    }
  }
  return out;
};

// ---------- Meal math ----------
// Sum kcal + protein across all slots for a day. Handles both new slot-array
// shape AND legacy boolean shape (fallback for any straggler days).
export const kcalForDay = (d) => {
  if (!d?.meals) return 0;
  const m = d.meals;
  // New shape: object with slot keys holding arrays
  if (m.M !== undefined || m.L !== undefined || m.E !== undefined || m.D !== undefined) {
    let total = 0;
    for (const slot of ['M', 'L', 'E', 'D']) {
      const arr = m[slot] || [];
      for (const e of arr) total += (e.kcal || 0) * (e.qty || 1);
    }
    return Math.round(total);
  }
  return 0;
};

export const proteinForDay = (d) => {
  if (!d) return 0;
  const m = d.meals || {};
  let total = 0;
  if (m.M !== undefined || m.L !== undefined || m.E !== undefined || m.D !== undefined) {
    for (const slot of ['M', 'L', 'E', 'D']) {
      const arr = m[slot] || [];
      for (const e of arr) total += (e.p || 0) * (e.qty || 1);
    }
  }
  // Manual top-up (e.g. supplement not in library) adds to the total
  if (d.metrics?.proteinG) total += d.metrics.proteinG;
  return Math.round(total);
};

export const kcalForSlot = (d, slot) => {
  const arr = d?.meals?.[slot] || [];
  let total = 0;
  for (const e of arr) total += (e.kcal || 0) * (e.qty || 1);
  return Math.round(total);
};

export const proteinForSlot = (d, slot) => {
  const arr = d?.meals?.[slot] || [];
  let total = 0;
  for (const e of arr) total += (e.p || 0) * (e.qty || 1);
  return Math.round(total);
};

export const slotFilled = (d, slot) => {
  const arr = d?.meals?.[slot] || [];
  return arr.length > 0;
};

// ---------- Scoring rubric (25 points preserved) ----------
// Skincare AM         4  (wash, vitc, moist, spf)
// Skincare PM         3  (cleanse, active, moist)
// Meals — slot kcal   4  (1 per slot landing within budget ±15%)
// Meals — slot logged 3  (1 per slot that has any items — M, L, D only. E is optional)
// Meals — protein     3  (1 at 60% target, +1 at 80%, +1 at 100%)
// Diet flags          2  (zeroSugar, zeroOil)
// Metrics             5  (steps≥8k, sleep≥7h, smoke=0, weight logged, water≥3L)
// Workout             1
// Total               25
//
// `options` carries the per-slot budgets and protein target. If missing,
// scoring uses conservative defaults so legacy days still score sensibly.
export const scoreDay = (d, options = {}) => {
  if (!d) return { pts: 0, max: 25, pct: 0 };
  let pts = 0;
  const max = 25;

  // Skin
  ['wash', 'vitc', 'moist', 'spf'].forEach(k => { if (d.skin?.am?.[k]) pts++; });
  ['cleanse', 'active', 'moist'].forEach(k => { if (d.skin?.pm?.[k]) pts++; });

  // Meals — kcal per slot
  const slotBudgets = options.slotBudgets || {
    M: { lo: 0, hi: 9999 }, L: { lo: 0, hi: 9999 },
    E: { lo: 0, hi: 9999 }, D: { lo: 0, hi: 9999 }
  };
  ['M', 'L', 'E', 'D'].forEach((slot) => {
    const kc = kcalForSlot(d, slot);
    const b = slotBudgets[slot];
    if (kc > 0 && b && kc >= b.lo && kc <= b.hi) pts++;
  });

  // Meals — logged (M, L, D required; evening is optional in this rubric)
  ['M', 'L', 'D'].forEach((slot) => {
    if (slotFilled(d, slot)) pts++;
  });

  // Meals — protein tiers
  const proteinTarget = options.proteinTarget || 120;
  const p = proteinForDay(d);
  if (p >= proteinTarget * 0.60) pts++;
  if (p >= proteinTarget * 0.80) pts++;
  if (p >= proteinTarget * 1.00) pts++;

  // Diet flags
  if (d.flags?.zeroSugar) pts++;
  if (d.flags?.zeroOil) pts++;

  // Metrics
  if ((d.metrics?.steps || 0) >= METRIC_TARGETS.steps) pts++;
  if ((d.metrics?.sleep || 0) >= METRIC_TARGETS.sleep) pts++;
  if (d.metrics?.smoke === 0) pts++;
  if (d.metrics?.weight != null && d.metrics.weight > 0) pts++;
  if ((d.metrics?.water || 0) >= METRIC_TARGETS.water) pts++;

  // Workout
  if (d.activity?.workout) pts++;

  return { pts, max, pct: Math.round((pts / max) * 100) };
};

export const complianceTier = (pct) => {
  if (pct >= 90) return 'full';
  if (pct >= 70) return 'high';
  if (pct >= 50) return 'mid';
  if (pct >= 25) return 'low';
  if (pct > 0) return 'fail';
  return 'empty';
};

export const tierColor = (tier) => ({
  full: 'var(--ok)',
  high: 'var(--ok-mid)',
  mid: 'var(--ok-lo)',
  low: 'var(--bad-lo)',
  fail: 'var(--bad)',
  empty: 'var(--bg-panel)'
}[tier] || 'var(--bg-panel)');

// ---------- Streak (strict) ----------
export const calcStreak = (days, todayK, options) => {
  let count = 0;
  let cursor = parseKey(todayK);
  while (true) {
    const k = dateKey(cursor);
    const dat = days[k];
    const sc = scoreDay(dat, options);
    if (dat && sc.pct >= 70) {
      count++;
      cursor = addDays(cursor, -1);
    } else break;
    if (count > 365) break;
  }
  return count;
};

// Forgiveness-aware streak: 2 free misses per rolling 28 days.
export const calcStreakForgiving = (days, todayK, opts = {}) => {
  const { threshold = 70, allowedMisses = 2, window = 28, scoreOptions } = opts;
  let count = 0;
  let cursor = parseKey(todayK);
  const missDates = [];
  let offset = 0;
  while (offset < 365) {
    const k = dateKey(cursor);
    const dat = days[k];
    const sc = scoreDay(dat, scoreOptions);
    const compliant = dat && sc.pct >= threshold;
    if (compliant) {
      count++;
    } else {
      const stillInWindow = missDates.filter((o) => offset - o < window);
      if (stillInWindow.length < allowedMisses) {
        stillInWindow.push(offset);
        missDates.length = 0;
        missDates.push(...stillInWindow);
        count++;
      } else {
        break;
      }
    }
    cursor = addDays(cursor, -1);
    offset++;
  }
  return count;
};

export const forgivenessRemaining = (days, todayK, opts = {}) => {
  const { threshold = 70, allowedMisses = 2, window = 28, scoreOptions } = opts;
  let used = 0;
  let cursor = parseKey(todayK);
  for (let i = 0; i < window; i++) {
    const k = dateKey(cursor);
    const dat = days[k];
    const sc = scoreDay(dat, scoreOptions);
    if (dat && sc.pct < threshold) used++;
    cursor = addDays(cursor, -1);
  }
  return Math.max(0, allowedMisses - used);
};

// ---------- Rolling / progress helpers ----------
export const firstLoggedWeight = (days) => {
  const keys = Object.keys(days).sort();
  for (const k of keys) {
    const w = days[k]?.metrics?.weight;
    if (w != null && w > 0) return w;
  }
  return null;
};

export const rollingAvg = (days, startKey, todayK, key, window) => {
  if (!startKey) return null;
  const idx = daysBetween(parseKey(startKey), parseKey(todayK));
  let sum = 0, ct = 0;
  for (let i = Math.max(0, idx - window + 1); i <= idx; i++) {
    const k = dateKey(addDays(parseKey(startKey), i));
    const v = days[k]?.metrics?.[key];
    if (v != null) { sum += v; ct++; }
  }
  return ct === 0 ? null : sum / ct;
};

export const metricPointsForChart = (days, startKey, todayK, key) => {
  if (!startKey) return [];
  const idx = daysBetween(parseKey(startKey), parseKey(todayK));
  const pts = [];
  for (let i = 0; i <= idx; i++) {
    const k = dateKey(addDays(parseKey(startKey), i));
    const v = days[k]?.metrics?.[key];
    if (v != null) pts.push({ x: i, y: v });
  }
  return pts;
};

// ---------- Skincare recommendation (unchanged) ----------
export const nightRecommendation = (days, startKey, todayK) => {
  if (!startKey) return { label: 'NIACINAMIDE', reason: 'safe default' };
  const idx = daysBetween(parseKey(startKey), parseKey(todayK));
  let retCount7 = 0;
  let lastRet = -99, lastNia = -99;
  for (let i = Math.max(0, idx - 6); i < idx; i++) {
    const k = dateKey(addDays(parseKey(startKey), i));
    const d = days[k];
    if (!d) continue;
    if (d.skin?.nightType === 'retinoid' && d.skin?.pm?.active) {
      retCount7++; lastRet = i;
    }
    if (d.skin?.nightType === 'niacinamide' && d.skin?.pm?.active) {
      lastNia = i;
    }
  }
  if (retCount7 >= 3) return { label: 'NIACINAMIDE', reason: 'weekly retinoid cap reached' };
  if (lastRet === idx - 1) return { label: 'NIACINAMIDE', reason: 'rest day after retinoid' };
  if (lastNia === idx - 1 && retCount7 < 3) return { label: 'RETINOID', reason: 'within weekly cap' };
  return { label: 'NIACINAMIDE', reason: 'safe default' };
};

// ---------- Progress helpers (used by DASH UI) ----------
export const skinProgress = (d) => {
  let done = 0;
  ['wash', 'vitc', 'moist', 'spf'].forEach(k => { if (d?.skin?.am?.[k]) done++; });
  ['cleanse', 'active', 'moist'].forEach(k => { if (d?.skin?.pm?.[k]) done++; });
  return { done, max: 7 };
};

// "Slots filled" proxy — replaces the old "10 meal items ticked" count.
export const mealProgress = (d) => {
  let done = 0;
  ['M', 'L', 'E', 'D'].forEach(slot => { if (slotFilled(d, slot)) done++; });
  return { done, max: 4 };
};
