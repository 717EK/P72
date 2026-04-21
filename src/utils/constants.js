export const TOTAL_DAYS = 120;
export const TARGET_WEIGHT = 72.0;

export const MEAL_KCAL = {
  m_eggs: 210, m_fruit: 70, m_drink: 5,
  l_protein: 240, l_carb: 140, l_veg: 90,
  e_almond: 75, e_tea: 0,
  d_protein: 240, d_veg: 150
};

export const MEAL_GROUPS = [
  {
    id: 'M', title: 'Morning', range: '300–350 kcal',
    items: [
      { k: 'm_eggs', t: '3 whole eggs', kc: 210 },
      { k: 'm_fruit', t: '1 whole fruit', kc: 70 },
      { k: 'm_drink', t: 'Black coffee / green tea', kc: 5 }
    ]
  },
  {
    id: 'L', title: 'Lunch', range: '450–500 kcal',
    items: [
      { k: 'l_protein', t: '150 g protein (chicken / paneer)', kc: 240 },
      { k: 'l_carb', t: '1 roti OR small rice portion', kc: 140 },
      { k: 'l_veg', t: 'Vegetables / salad', kc: 90 }
    ]
  },
  {
    id: 'E', title: 'Evening', range: '150–200 kcal',
    items: [
      { k: 'e_almond', t: '8–10 almonds', kc: 75 },
      { k: 'e_tea', t: 'Green tea', kc: 0 }
    ]
  },
  {
    id: 'D', title: 'Dinner', range: '400–450 kcal',
    items: [
      { k: 'd_protein', t: '150 g protein', kc: 240 },
      { k: 'd_veg', t: 'Vegetables (no heavy carbs)', kc: 150 }
    ]
  }
];

// proteinHit is retained for back-compat with old data, but the UI now logs
// protein in grams (see BodyMetrics) and derives proteinHit from the target.
export const DIET_FLAGS = [
  { k: 'zeroSugar', t: 'Zero sugar' },
  { k: 'zeroOil', t: 'Zero oily / fried food' }
];

export const ACTIVITY_TOGGLES = [
  { k: 'workout', t: 'Light weights / bodyweight', note: 'TGT 3–4x/WK' },
  { k: 'cardio', t: 'Cardio (walk / run)' },
  { k: 'stretch', t: 'Stretch / mobility' }
];

export const AM_ROUTINE = [
  { k: 'wash', t: 'Simple Kind To Skin Wash' },
  { k: 'vitc', t: 'Minimalist 10% Vitamin C' },
  { k: 'moist', t: 'Re\u2019equil Ceramide & HA Moisturiser' },
  { k: 'spf', t: 'Fixderma Shadow SPF 50+ Gel' }
];

export const PM_RETINOID = [
  { k: 'cleanse', t: 'Simple Kind To Skin Wash' },
  { k: 'active', t: 'Minimalist Granactive Retinoid 2%', pill: '3x/WK' },
  { k: 'moist', t: 'Re\u2019equil Ceramide & HA Moisturiser' }
];

export const PM_NIACINAMIDE = [
  { k: 'cleanse', t: 'Simple Kind To Skin Wash' },
  { k: 'active', t: 'Minimalist 5% Niacinamide', pill: 'ALT DAYS' },
  { k: 'moist', t: 'Re\u2019equil Ceramide & HA Moisturiser' }
];

export const MILESTONES = [
  { wk: 2, d: 'Weight drop initiates — water + early fat' },
  { wk: 4, d: 'Facial sharpness becomes visible' },
  { wk: 8, d: 'Visible transformation — jawline, composition' },
  { wk: 13, d: '~72 kg target window (wk 12–14)' }
];

export const TABS = [
  { id: 'dash', label: 'DASH' },
  { id: 'skin', label: 'SKIN' },
  { id: 'fuel', label: 'FUEL' },
  { id: 'log',  label: 'LOG' }
];

export const METRIC_TARGETS = {
  steps: 8000,
  sleep: 7,
  water: 3,
  weight: TARGET_WEIGHT,
  smoke: 0
};
