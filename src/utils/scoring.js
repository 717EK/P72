import { MEAL_KCAL, METRIC_TARGETS } from './constants';
import { addDays, dateKey, parseKey, daysBetween } from './dates';

export const blankDay = () => ({
  skin: {
    am: { wash: false, vitc: false, moist: false, spf: false },
    pm: { cleanse: false, active: false, moist: false },
    nightType: 'niacinamide'
  },
  meals: {
    m_eggs: false, m_fruit: false, m_drink: false,
    l_protein: false, l_carb: false, l_veg: false,
    e_almond: false, e_tea: false,
    d_protein: false, d_veg: false
  },
  flags: { zeroSugar: false, zeroOil: false, proteinHit: false },
  metrics: { weight: null, steps: null, sleep: null, water: null, smoke: null, proteinG: null },
  activity: { workout: false, cardio: false, stretch: false }
});

export const mergeDay = (base, src) => {
  if (!src) return base;
  const out = JSON.parse(JSON.stringify(base));
  for (const group of Object.keys(src)) {
    const v = src[group];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[group] = { ...(out[group] || {}), ...v };
    } else {
      out[group] = v;
    }
  }
  return out;
};

export const scoreDay = (d) => {
  if (!d) return { pts: 0, max: 25, pct: 0 };
  let pts = 0;
  const max = 25;
  ['wash', 'vitc', 'moist', 'spf'].forEach(k => { if (d.skin?.am?.[k]) pts++; });
  ['cleanse', 'active', 'moist'].forEach(k => { if (d.skin?.pm?.[k]) pts++; });
  Object.keys(MEAL_KCAL).forEach(k => { if (d.meals?.[k]) pts++; });
  ['zeroSugar', 'zeroOil', 'proteinHit'].forEach(k => { if (d.flags?.[k]) pts++; });
  if ((d.metrics?.steps || 0) >= METRIC_TARGETS.steps) pts++;
  if ((d.metrics?.sleep || 0) >= METRIC_TARGETS.sleep) pts++;
  if (d.metrics?.smoke === 0) pts++;
  if (d.metrics?.weight != null && d.metrics.weight > 0) pts++;
  if (d.activity?.workout) pts++;
  return { pts, max, pct: Math.round((pts / max) * 100) };
};

export const kcalForDay = (d) => {
  if (!d?.meals) return 0;
  let k = 0;
  for (const key of Object.keys(MEAL_KCAL)) if (d.meals[key]) k += MEAL_KCAL[key];
  return k;
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

export const calcStreak = (days, todayK) => {
  let count = 0;
  let cursor = parseKey(todayK);
  while (true) {
    const k = dateKey(cursor);
    const dat = days[k];
    const sc = scoreDay(dat);
    if (dat && sc.pct >= 70) {
      count++;
      cursor = addDays(cursor, -1);
    } else break;
    if (count > 365) break;
  }
  return count;
};

// Forgiveness-aware streak: allows up to `allowedMisses` missed days in the
// current rolling `window` of calendar days (default 2 misses per 28 days).
// Walks backward from today, counting compliant days. A miss is tolerated iff
// it would not bring the miss count inside the last `window` days above the cap.
export const calcStreakForgiving = (days, todayK, opts = {}) => {
  const { threshold = 70, allowedMisses = 2, window = 28 } = opts;
  let count = 0;
  let cursor = parseKey(todayK);
  const missDates = []; // offsets-from-today where a miss was consumed
  let offset = 0;
  while (offset < 365) {
    const k = dateKey(cursor);
    const dat = days[k];
    const sc = scoreDay(dat);
    const compliant = dat && sc.pct >= threshold;
    if (compliant) {
      count++;
    } else {
      // Trim out misses older than `window` days — they don't count against us.
      const stillInWindow = missDates.filter((o) => offset - o < window);
      if (stillInWindow.length < allowedMisses) {
        stillInWindow.push(offset);
        missDates.length = 0;
        missDates.push(...stillInWindow);
        count++; // "free" miss still extends the streak
      } else {
        break;
      }
    }
    cursor = addDays(cursor, -1);
    offset++;
  }
  return count;
};

// How many forgiveness "saves" are left in the current 28-day window.
export const forgivenessRemaining = (days, todayK, opts = {}) => {
  const { threshold = 70, allowedMisses = 2, window = 28 } = opts;
  let used = 0;
  let cursor = parseKey(todayK);
  for (let i = 0; i < window; i++) {
    const k = dateKey(cursor);
    const dat = days[k];
    const sc = scoreDay(dat);
    // Only count missed days that actually had the chance to be logged
    if (dat && sc.pct < threshold) used++;
    cursor = addDays(cursor, -1);
  }
  return Math.max(0, allowedMisses - used);
};

export const firstLoggedWeight = (days) => {
  const keys = Object.keys(days).sort();
  for (const k of keys) {
    const w = days[k]?.metrics?.weight;
    if (w != null && w > 0) return w;
  }
  return null;
};

export const rollingAvg = (days, startKey, todayK, key, window) => {
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
  const idx = daysBetween(parseKey(startKey), parseKey(todayK));
  const pts = [];
  for (let i = 0; i <= idx; i++) {
    const k = dateKey(addDays(parseKey(startKey), i));
    const v = days[k]?.metrics?.[key];
    if (v != null) pts.push({ x: i, y: v });
  }
  return pts;
};

export const nightRecommendation = (days, startKey, todayK) => {
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

export const skinProgress = (d) => {
  let done = 0;
  ['wash', 'vitc', 'moist', 'spf'].forEach(k => { if (d?.skin?.am?.[k]) done++; });
  ['cleanse', 'active', 'moist'].forEach(k => { if (d?.skin?.pm?.[k]) done++; });
  return { done, max: 7 };
};

export const mealProgress = (d) => {
  let done = 0;
  for (const k of Object.keys(MEAL_KCAL)) if (d?.meals?.[k]) done++;
  return { done, max: 10 };
};
