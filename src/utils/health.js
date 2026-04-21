// Body-composition math + Apple Health import parsers.
// BMR via Mifflin-St Jeor. All units metric internally (kg, cm).

export const ACTIVITY_FACTORS = {
  sedentary: { f: 1.2, label: 'SEDENTARY', note: 'Desk job, no workouts' },
  light:     { f: 1.375, label: 'LIGHT',    note: '1–3 light sessions / wk' },
  moderate:  { f: 1.55,  label: 'MODERATE', note: '3–5 sessions / wk' },
  active:    { f: 1.725, label: 'ACTIVE',   note: '6–7 sessions / wk' },
  athlete:   { f: 1.9,   label: 'ATHLETE',  note: '2x/day, physical job' }
};

export const SEX_OPTIONS = [
  { k: 'male',   label: 'MALE' },
  { k: 'female', label: 'FEMALE' },
  { k: 'other',  label: 'OTHER' }
];

// Mifflin-St Jeor — returns kcal
export const bmr = ({ sex, weightKg, heightCm, ageYears }) => {
  if (!weightKg || !heightCm || !ageYears) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  // "other" averages male and female offsets (+5 and -161 → -78)
  const offset = sex === 'male' ? 5 : sex === 'female' ? -161 : -78;
  return Math.round(base + offset);
};

export const tdee = (profile) => {
  const b = bmr(profile);
  if (b == null) return null;
  const f = ACTIVITY_FACTORS[profile.activity]?.f ?? 1.2;
  return Math.round(b * f);
};

// Returns { lo, hi, center, deficit } kcal window.
// intensity: 'standard' (-500) or 'aggressive' (-750). Falls back to standard.
export const calorieWindow = (profile) => {
  const t = tdee(profile);
  const intensity = profile?.intensity || 'standard';
  const deficit = intensity === 'aggressive' ? 750 : 500;
  if (t == null) {
    // Safe default when stats missing
    const lo = intensity === 'aggressive' ? 1300 : 1400;
    return { lo, hi: lo + 250, center: lo + 125, deficit };
  }
  const target = t - deficit;
  const floor = profile?.sex === 'female'
    ? (intensity === 'aggressive' ? 1100 : 1200)
    : (intensity === 'aggressive' ? 1300 : 1400);
  const center = Math.max(floor, target);
  return { lo: center - 125, hi: center + 125, center, deficit };
};

// Per-slot kcal budget. Default split M 22% · L 33% · E 13% · D 32%.
// Returns { M, L, E, D } each = { lo, hi, center }.
export const slotBudgets = (profile, split = { M: 0.22, L: 0.33, E: 0.13, D: 0.32 }) => {
  const win = calorieWindow(profile);
  const centerTotal = win.center;
  const slotPct = 0.15; // ±15% tolerance per slot
  const out = {};
  for (const k of Object.keys(split)) {
    const center = Math.round(centerTotal * split[k]);
    out[k] = {
      center,
      lo: Math.round(center * (1 - slotPct)),
      hi: Math.round(center * (1 + slotPct))
    };
  }
  return out;
};

// Protein target in grams (1.8 g/kg bodyweight, a defensible middle for a cut)
export const proteinTargetG = (profile) => {
  if (!profile?.weightKg) return 120;
  return Math.round(profile.weightKg * 1.8);
};

export const bmi = ({ weightKg, heightCm }) => {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
};

export const bmiTier = (v) => {
  if (v == null) return { label: '—', tone: '' };
  if (v < 18.5) return { label: 'UNDERWEIGHT', tone: 'warn' };
  if (v < 25)   return { label: 'HEALTHY',     tone: 'ok' };
  if (v < 30)   return { label: 'OVERWEIGHT',  tone: 'warn' };
  return          { label: 'OBESE',            tone: 'bad' };
};

export const ageFrom = (dobKey) => {
  if (!dobKey) return null;
  const [y, m, d] = dobKey.split('-').map(Number);
  const dob = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const mDiff = now.getMonth() - dob.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age;
};

// Unit helpers
export const ftInToCm = (ft, inches) =>
  Math.round(((Number(ft) || 0) * 12 + (Number(inches) || 0)) * 2.54);
export const lbsToKg = (lbs) => +(Number(lbs) * 0.45359237).toFixed(1);

// ---------- Apple Health import parsers ----------
// We support two formats:
//
// 1) Health Auto Export (third-party iOS app, JSON format).
//    Shape: { data: { metrics: [{ name: "step_count", units: "count", data: [{ date: "...", qty: 1234 }] }] } }
//
// 2) Raw export.xml from Apple's built-in Health export.
//    We parse as XML in-browser via DOMParser and look for
//    <Record type="HKQuantityTypeIdentifierStepCount" startDate="..." value="..." />
//
// Both parsers return an array: [{ key: 'YYYY-MM-DD', steps: number }]

const pad2 = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const parseHealthAutoExportJson = (text) => {
  let obj;
  try { obj = JSON.parse(text); } catch { return { error: 'INVALID JSON' }; }
  const metrics = obj?.data?.metrics || obj?.metrics || [];
  const steps = metrics.find((m) => {
    const n = (m.name || '').toLowerCase();
    return n.includes('step'); // matches "step_count", "steps", "Step Count"
  });
  if (!steps || !Array.isArray(steps.data)) return { error: 'NO STEP COUNT METRIC FOUND' };
  const byKey = {};
  for (const pt of steps.data) {
    const dateStr = pt.date || pt.startDate;
    if (!dateStr) continue;
    const d = new Date(dateStr);
    if (isNaN(d)) continue;
    const key = toKey(d);
    const qty = Number(pt.qty ?? pt.value ?? 0);
    byKey[key] = (byKey[key] || 0) + qty;
  }
  return {
    rows: Object.entries(byKey)
      .map(([key, steps]) => ({ key, steps: Math.round(steps) }))
      .sort((a, b) => a.key.localeCompare(b.key))
  };
};

export const parseAppleHealthXml = (text) => {
  let doc;
  try {
    doc = new DOMParser().parseFromString(text, 'application/xml');
  } catch {
    return { error: 'XML PARSE FAILED' };
  }
  const err = doc.querySelector('parsererror');
  if (err) return { error: 'XML PARSE FAILED' };
  const records = doc.querySelectorAll(
    'Record[type="HKQuantityTypeIdentifierStepCount"]'
  );
  if (!records.length) return { error: 'NO STEP COUNT RECORDS' };
  const byKey = {};
  records.forEach((r) => {
    const startDate = r.getAttribute('startDate');
    const v = Number(r.getAttribute('value') || 0);
    if (!startDate || !v) return;
    const d = new Date(startDate);
    if (isNaN(d)) return;
    const key = toKey(d);
    byKey[key] = (byKey[key] || 0) + v;
  });
  return {
    rows: Object.entries(byKey)
      .map(([key, steps]) => ({ key, steps: Math.round(steps) }))
      .sort((a, b) => a.key.localeCompare(b.key))
  };
};

export const parseHealthImport = (text) => {
  const t = (text || '').trim();
  if (!t) return { error: 'EMPTY INPUT' };
  if (t.startsWith('<')) return parseAppleHealthXml(t);
  return parseHealthAutoExportJson(t);
};
