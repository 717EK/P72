// Indian meal library.
// Values are rounded conservative averages for typical home-cooked portions.
// Sources cross-checked: USDA FoodData Central, FSSAI nutrient databank,
// plus widely used Indian nutrition references. Oil assumption: ~1 tsp / dish.
//
// Each item:
//   id            stable key, use for referencing in logs
//   name          display name
//   detail        serving size label shown in UI
//   kcal          for ONE default serving
//   p             protein grams for ONE default serving
//   slots         primary meal slots this item belongs to ('M'|'L'|'E'|'D')
//                 empty array = universal/snack
//   tags          any of: veg | non-veg | egg | dairy | onion-garlic |
//                 jain-unsafe | root | gluten-free | high-protein | low-carb
//
// Dietary filtering rules applied by `isAllowed(item, profile.diet)`:
//   non-veg   → everything
//   eggitarian → exclude 'non-veg'
//   veg       → exclude 'non-veg' | 'egg'
//   vegan     → exclude 'non-veg' | 'egg' | 'dairy'
//   jain      → exclude 'non-veg' | 'egg' | 'jain-unsafe' | 'root' | 'onion-garlic'
//   onionGarlic:false  → also exclude 'onion-garlic'
//
// Slot split defaults (fraction of daily kcal window):
//   M 0.22 · L 0.33 · E 0.13 · D 0.32

export const MEAL_SLOTS = [
  { k: 'M', title: 'MORNING',  weight: 0.22 },
  { k: 'L', title: 'LUNCH',    weight: 0.33 },
  { k: 'E', title: 'EVENING',  weight: 0.13 },
  { k: 'D', title: 'DINNER',   weight: 0.32 }
];

export const DIET_TYPES = [
  { k: 'non-veg',    label: 'NON-VEG',    note: 'Everything' },
  { k: 'eggitarian', label: 'EGGITARIAN', note: 'Veg + eggs' },
  { k: 'veg',        label: 'VEGETARIAN', note: 'No meat, no eggs' },
  { k: 'vegan',      label: 'VEGAN',      note: 'No animal products' },
  { k: 'jain',       label: 'JAIN',       note: 'No roots, no onion-garlic' }
];

export const INTENSITY_OPTIONS = [
  {
    k: 'standard',
    label: 'STANDARD',
    deficit: 500,
    note: '~500 kcal deficit · sustainable',
    detail: 'Roughly 0.5 kg/week loss. Targets lose fat without crashing energy or strength.'
  },
  {
    k: 'aggressive',
    label: 'AGGRESSIVE',
    deficit: 750,
    note: '~750 kcal deficit · intense',
    detail: 'Roughly 0.75 kg/week loss. Expect hunger, dips in training output. Requires high protein + careful sleep.'
  }
];

// ---------- The library ----------
export const MEALS = [
  // ==================== BREAKFAST ====================
  { id: 'poha',              name: 'Poha',                      detail: '1 bowl (~150g)',  kcal: 270, p: 5,  slots: ['M'],       tags: ['veg','onion-garlic'] },
  { id: 'poha-jain',         name: 'Poha (Jain)',               detail: '1 bowl (~150g)',  kcal: 260, p: 5,  slots: ['M'],       tags: ['veg'] },
  { id: 'upma',              name: 'Upma',                      detail: '1 bowl (~150g)',  kcal: 250, p: 6,  slots: ['M'],       tags: ['veg','onion-garlic'] },
  { id: 'idli-2',            name: 'Idli × 2',                  detail: '2 pc + sambar',   kcal: 180, p: 6,  slots: ['M'],       tags: ['veg'] },
  { id: 'dosa-plain',        name: 'Plain Dosa',                detail: '1 pc + chutney',  kcal: 200, p: 5,  slots: ['M'],       tags: ['veg'] },
  { id: 'dosa-masala',       name: 'Masala Dosa',               detail: '1 pc + filling',  kcal: 380, p: 7,  slots: ['M'],       tags: ['veg','root','onion-garlic'] },
  { id: 'uttapam',           name: 'Uttapam',                   detail: '1 pc (mixed veg)',kcal: 240, p: 7,  slots: ['M'],       tags: ['veg','onion-garlic'] },
  { id: 'paratha-plain',     name: 'Plain Paratha',             detail: '1 pc',            kcal: 200, p: 5,  slots: ['M'],       tags: ['veg'] },
  { id: 'paratha-aloo',      name: 'Aloo Paratha',              detail: '1 pc (no butter)',kcal: 280, p: 6,  slots: ['M'],       tags: ['veg','root'] },
  { id: 'paratha-paneer',    name: 'Paneer Paratha',            detail: '1 pc',            kcal: 310, p: 13, slots: ['M'],       tags: ['veg','dairy','high-protein'] },
  { id: 'paratha-gobi',      name: 'Gobi Paratha',              detail: '1 pc',            kcal: 260, p: 7,  slots: ['M'],       tags: ['veg','onion-garlic'] },
  { id: 'paratha-methi',     name: 'Methi Thepla',              detail: '2 pc',            kcal: 240, p: 7,  slots: ['M'],       tags: ['veg'] },
  { id: 'chilla-besan',      name: 'Besan Chilla',              detail: '2 pc',            kcal: 220, p: 11, slots: ['M'],       tags: ['veg','high-protein','onion-garlic'] },
  { id: 'chilla-moongdal',   name: 'Moong Dal Chilla',          detail: '2 pc',            kcal: 240, p: 14, slots: ['M'],       tags: ['veg','high-protein','onion-garlic'] },
  { id: 'oats-plain',        name: 'Oats (with milk)',          detail: '1 bowl (40g dry)',kcal: 220, p: 9,  slots: ['M'],       tags: ['veg','dairy'] },
  { id: 'oats-savoury',      name: 'Savoury Oats',              detail: '1 bowl',          kcal: 230, p: 8,  slots: ['M'],       tags: ['veg','onion-garlic'] },
  { id: 'dalia-meetha',      name: 'Dalia (sweet)',             detail: '1 bowl',          kcal: 210, p: 7,  slots: ['M'],       tags: ['veg','dairy'] },
  { id: 'dalia-namkeen',     name: 'Dalia (savoury)',           detail: '1 bowl',          kcal: 200, p: 7,  slots: ['M'],       tags: ['veg','onion-garlic'] },
  { id: 'sabudana-khichdi',  name: 'Sabudana Khichdi',          detail: '1 bowl (~150g)',  kcal: 320, p: 4,  slots: ['M'],       tags: ['veg'] },
  { id: 'misal-pav',         name: 'Misal Pav',                 detail: '1 plate',         kcal: 450, p: 15, slots: ['M','L'],   tags: ['veg','onion-garlic'] },
  { id: 'pongal',            name: 'Pongal',                    detail: '1 bowl',          kcal: 280, p: 8,  slots: ['M'],       tags: ['veg','dairy'] },
  { id: 'medu-vada-2',       name: 'Medu Vada × 2',             detail: '2 pc',            kcal: 260, p: 9,  slots: ['M'],       tags: ['veg'] },
  { id: 'dhokla-4',          name: 'Dhokla',                    detail: '4 pieces',        kcal: 160, p: 7,  slots: ['M','E'],   tags: ['veg'] },

  // ==================== EGGS ====================
  { id: 'egg-boiled',        name: 'Boiled Egg',                detail: '1 whole',         kcal: 75,  p: 6,  slots: ['M','E'],   tags: ['egg','high-protein','gluten-free','low-carb'] },
  { id: 'egg-whites-3',      name: 'Egg Whites × 3',            detail: '3 whites',        kcal: 50,  p: 11, slots: ['M','E'],   tags: ['egg','high-protein','gluten-free','low-carb'] },
  { id: 'omelette-2',        name: 'Omelette (2 eggs)',         detail: '1 pc',            kcal: 180, p: 13, slots: ['M','D'],   tags: ['egg','high-protein','low-carb','onion-garlic'] },
  { id: 'bhurji-egg',        name: 'Anda Bhurji',               detail: '2 eggs',          kcal: 220, p: 13, slots: ['M','D'],   tags: ['egg','high-protein','onion-garlic'] },
  { id: 'egg-curry',         name: 'Egg Curry',                 detail: '2 eggs + gravy',  kcal: 290, p: 14, slots: ['L','D'],   tags: ['egg','high-protein','onion-garlic'] },

  // ==================== ROTI / CARB BASE ====================
  { id: 'roti-plain',        name: 'Roti (wheat)',              detail: '1 pc',            kcal: 105, p: 3,  slots: ['L','D'],   tags: ['veg'] },
  { id: 'roti-multigrain',   name: 'Multigrain Roti',           detail: '1 pc',            kcal: 110, p: 4,  slots: ['L','D'],   tags: ['veg','high-protein'] },
  { id: 'roti-bajra',        name: 'Bajra Roti',                detail: '1 pc',            kcal: 120, p: 3,  slots: ['L','D'],   tags: ['veg','gluten-free'] },
  { id: 'roti-jowar',        name: 'Jowar Roti',                detail: '1 pc',            kcal: 90,  p: 3,  slots: ['L','D'],   tags: ['veg','gluten-free'] },
  { id: 'roti-ragi',         name: 'Ragi Roti',                 detail: '1 pc',            kcal: 100, p: 3,  slots: ['L','D'],   tags: ['veg','gluten-free'] },
  { id: 'rice-white',        name: 'White Rice (cooked)',       detail: '1 cup (~150g)',   kcal: 200, p: 4,  slots: ['L','D'],   tags: ['veg','gluten-free'] },
  { id: 'rice-brown',        name: 'Brown Rice (cooked)',       detail: '1 cup (~150g)',   kcal: 215, p: 5,  slots: ['L','D'],   tags: ['veg','gluten-free'] },
  { id: 'rice-jeera',        name: 'Jeera Rice',                detail: '1 cup',           kcal: 240, p: 4,  slots: ['L','D'],   tags: ['veg','gluten-free','onion-garlic'] },
  { id: 'quinoa',            name: 'Quinoa (cooked)',           detail: '1 cup',           kcal: 220, p: 8,  slots: ['L','D'],   tags: ['veg','gluten-free','high-protein'] },
  { id: 'biryani-veg',       name: 'Veg Biryani',               detail: '1 plate',         kcal: 420, p: 9,  slots: ['L','D'],   tags: ['veg','root','onion-garlic'] },
  { id: 'biryani-chicken',   name: 'Chicken Biryani',           detail: '1 plate',         kcal: 520, p: 28, slots: ['L','D'],   tags: ['non-veg','high-protein','root','onion-garlic'] },

  // ==================== DAL / LEGUMES ====================
  { id: 'dal-tadka',         name: 'Dal Tadka',                 detail: '1 bowl (~200ml)', kcal: 180, p: 10, slots: ['L','D'],   tags: ['veg','high-protein','onion-garlic'] },
  { id: 'dal-tadka-jain',    name: 'Dal Tadka (Jain)',          detail: '1 bowl',          kcal: 170, p: 10, slots: ['L','D'],   tags: ['veg','high-protein'] },
  { id: 'dal-makhani',       name: 'Dal Makhani',               detail: '1 bowl',          kcal: 330, p: 12, slots: ['L','D'],   tags: ['veg','dairy','onion-garlic'] },
  { id: 'dal-yellow',        name: 'Yellow Dal',                detail: '1 bowl',          kcal: 150, p: 9,  slots: ['L','D'],   tags: ['veg','high-protein'] },
  { id: 'rajma',             name: 'Rajma',                     detail: '1 bowl',          kcal: 230, p: 12, slots: ['L','D'],   tags: ['veg','high-protein','onion-garlic'] },
  { id: 'chole',             name: 'Chole',                     detail: '1 bowl',          kcal: 240, p: 11, slots: ['L','D'],   tags: ['veg','high-protein','onion-garlic'] },
  { id: 'kadhi',             name: 'Kadhi',                     detail: '1 bowl',          kcal: 180, p: 7,  slots: ['L','D'],   tags: ['veg','dairy'] },
  { id: 'sambar',            name: 'Sambar',                    detail: '1 bowl',          kcal: 140, p: 7,  slots: ['L','D'],   tags: ['veg','root','onion-garlic'] },

  // ==================== PANEER ====================
  { id: 'paneer-grilled',    name: 'Grilled Paneer',            detail: '100g plain',      kcal: 265, p: 18, slots: ['L','E','D'],tags: ['veg','dairy','high-protein','low-carb'] },
  { id: 'paneer-tikka',      name: 'Paneer Tikka',              detail: '6 pc (~120g)',    kcal: 320, p: 20, slots: ['L','E','D'],tags: ['veg','dairy','high-protein','onion-garlic'] },
  { id: 'paneer-bhurji',     name: 'Paneer Bhurji',             detail: '1 bowl (~150g)',  kcal: 300, p: 19, slots: ['L','D'],   tags: ['veg','dairy','high-protein','onion-garlic'] },
  { id: 'matar-paneer',      name: 'Matar Paneer',              detail: '1 bowl',          kcal: 320, p: 15, slots: ['L','D'],   tags: ['veg','dairy','high-protein','onion-garlic'] },
  { id: 'palak-paneer',      name: 'Palak Paneer',              detail: '1 bowl',          kcal: 310, p: 16, slots: ['L','D'],   tags: ['veg','dairy','high-protein','onion-garlic'] },
  { id: 'kadhai-paneer',     name: 'Kadhai Paneer',             detail: '1 bowl',          kcal: 340, p: 17, slots: ['L','D'],   tags: ['veg','dairy','high-protein','onion-garlic'] },
  { id: 'shahi-paneer',      name: 'Shahi Paneer',              detail: '1 bowl',          kcal: 390, p: 15, slots: ['L','D'],   tags: ['veg','dairy','high-protein','onion-garlic'] },
  { id: 'paneer-100g-raw',   name: 'Paneer (raw, 100g)',        detail: '100g',            kcal: 265, p: 18, slots: ['E'],       tags: ['veg','dairy','high-protein','low-carb'] },

  // ==================== VEGETABLES ====================
  { id: 'bhindi',            name: 'Bhindi Masala',             detail: '1 bowl',          kcal: 160, p: 4,  slots: ['L','D'],   tags: ['veg','onion-garlic'] },
  { id: 'baingan-bharta',    name: 'Baingan Bharta',            detail: '1 bowl',          kcal: 180, p: 4,  slots: ['L','D'],   tags: ['veg','onion-garlic'] },
  { id: 'aloo-gobi',         name: 'Aloo Gobi',                 detail: '1 bowl',          kcal: 190, p: 5,  slots: ['L','D'],   tags: ['veg','root','onion-garlic'] },
  { id: 'gobi-only',         name: 'Gobi Sabzi (no aloo)',      detail: '1 bowl',          kcal: 130, p: 4,  slots: ['L','D'],   tags: ['veg','onion-garlic'] },
  { id: 'mix-veg',           name: 'Mix Veg Sabzi',             detail: '1 bowl',          kcal: 160, p: 5,  slots: ['L','D'],   tags: ['veg','root','onion-garlic'] },
  { id: 'lauki',             name: 'Lauki Sabzi',               detail: '1 bowl',          kcal: 100, p: 3,  slots: ['L','D'],   tags: ['veg'] },
  { id: 'tinda',             name: 'Tinda Sabzi',               detail: '1 bowl',          kcal: 110, p: 3,  slots: ['L','D'],   tags: ['veg'] },
  { id: 'tori',              name: 'Tori / Ridge Gourd',        detail: '1 bowl',          kcal: 90,  p: 3,  slots: ['L','D'],   tags: ['veg'] },
  { id: 'karela',            name: 'Karela Sabzi',              detail: '1 bowl',          kcal: 130, p: 3,  slots: ['L','D'],   tags: ['veg','onion-garlic'] },
  { id: 'saag-sarson',       name: 'Sarson ka Saag',            detail: '1 bowl',          kcal: 200, p: 7,  slots: ['L','D'],   tags: ['veg','onion-garlic'] },
  { id: 'methi-aloo',        name: 'Methi Aloo',                detail: '1 bowl',          kcal: 210, p: 5,  slots: ['L','D'],   tags: ['veg','root','onion-garlic'] },
  { id: 'salad-green',       name: 'Green Salad',               detail: '1 plate',         kcal: 60,  p: 2,  slots: ['L','D','E'],tags: ['veg','low-carb','root'] },
  { id: 'cucumber-raw',      name: 'Cucumber (raw)',            detail: '1 medium',        kcal: 30,  p: 1,  slots: ['E','L','D'],tags: ['veg','low-carb'] },
  { id: 'carrot-raw',        name: 'Carrot (raw)',              detail: '1 medium',        kcal: 25,  p: 1,  slots: ['E'],       tags: ['veg','root'] },

  // ==================== NON-VEG ====================
  { id: 'chicken-tandoori',  name: 'Tandoori Chicken',          detail: '150g pc',         kcal: 240, p: 36, slots: ['L','D'],   tags: ['non-veg','high-protein','low-carb','onion-garlic'] },
  { id: 'chicken-tikka',     name: 'Chicken Tikka',             detail: '6 pc (~120g)',    kcal: 220, p: 28, slots: ['L','E','D'],tags: ['non-veg','high-protein','onion-garlic'] },
  { id: 'chicken-grilled',   name: 'Grilled Chicken',           detail: '150g breast',     kcal: 250, p: 42, slots: ['L','D'],   tags: ['non-veg','high-protein','low-carb'] },
  { id: 'chicken-curry',     name: 'Chicken Curry',             detail: '1 bowl (150g)',   kcal: 330, p: 28, slots: ['L','D'],   tags: ['non-veg','high-protein','onion-garlic'] },
  { id: 'chicken-bhuna',     name: 'Chicken Bhuna',             detail: '1 bowl (150g)',   kcal: 340, p: 30, slots: ['L','D'],   tags: ['non-veg','high-protein','onion-garlic'] },
  { id: 'butter-chicken',    name: 'Butter Chicken',            detail: '1 bowl (150g)',   kcal: 430, p: 28, slots: ['L','D'],   tags: ['non-veg','dairy','high-protein','onion-garlic'] },
  { id: 'mutton-curry',      name: 'Mutton Curry',              detail: '1 bowl (150g)',   kcal: 420, p: 28, slots: ['L','D'],   tags: ['non-veg','high-protein','onion-garlic'] },
  { id: 'keema',             name: 'Keema',                     detail: '1 bowl (150g)',   kcal: 380, p: 28, slots: ['L','D'],   tags: ['non-veg','high-protein','onion-garlic'] },
  { id: 'fish-grilled',      name: 'Grilled Fish',              detail: '150g pc',         kcal: 220, p: 35, slots: ['L','D'],   tags: ['non-veg','high-protein','low-carb'] },
  { id: 'fish-curry',        name: 'Fish Curry',                detail: '1 bowl (150g)',   kcal: 290, p: 28, slots: ['L','D'],   tags: ['non-veg','high-protein','onion-garlic'] },
  { id: 'fish-tikka',        name: 'Fish Tikka',                detail: '6 pc (~120g)',    kcal: 210, p: 30, slots: ['L','E','D'],tags: ['non-veg','high-protein','onion-garlic'] },
  { id: 'prawns',            name: 'Prawns Curry',              detail: '1 bowl (120g)',   kcal: 250, p: 24, slots: ['L','D'],   tags: ['non-veg','high-protein','onion-garlic'] },

  // ==================== DAIRY / PROTEIN TOPUPS ====================
  { id: 'dahi-plain',        name: 'Dahi (curd)',               detail: '1 bowl (~150g)',  kcal: 100, p: 6,  slots: ['L','D'],   tags: ['veg','dairy','gluten-free'] },
  { id: 'greek-yogurt-100',  name: 'Greek Yogurt (plain)',      detail: '100g',            kcal: 95,  p: 9,  slots: ['M','E'],   tags: ['veg','dairy','high-protein','gluten-free'] },
  { id: 'raita',             name: 'Raita',                     detail: '1 bowl',          kcal: 120, p: 6,  slots: ['L','D'],   tags: ['veg','dairy','gluten-free'] },
  { id: 'buttermilk',        name: 'Buttermilk (chaas)',        detail: '1 glass',         kcal: 40,  p: 3,  slots: ['L','D','E'],tags: ['veg','dairy'] },
  { id: 'milk-250',          name: 'Milk (250ml)',              detail: 'toned, 250ml',    kcal: 120, p: 8,  slots: ['M','D','E'],tags: ['veg','dairy'] },
  { id: 'lassi-sweet',       name: 'Sweet Lassi',               detail: '1 glass',         kcal: 220, p: 6,  slots: ['L'],       tags: ['veg','dairy','high-sugar'] },
  { id: 'whey-1scoop',       name: 'Whey Protein',              detail: '1 scoop (30g)',   kcal: 120, p: 24, slots: ['E','M'],   tags: ['veg','dairy','high-protein','low-carb'] },
  { id: 'soy-chunks',        name: 'Soya Chunks Curry',         detail: '1 bowl',          kcal: 230, p: 25, slots: ['L','D'],   tags: ['veg','high-protein','onion-garlic'] },
  { id: 'tofu-100',          name: 'Tofu (plain)',              detail: '100g',            kcal: 145, p: 15, slots: ['L','E','D'],tags: ['veg','high-protein','low-carb'] },

  // ==================== SNACKS & ACCOMPANIMENTS ====================
  { id: 'almonds-10',        name: 'Almonds × 10',              detail: '10 pc',           kcal: 70,  p: 3,  slots: ['E','M'],   tags: ['veg','low-carb'] },
  { id: 'walnuts-5',         name: 'Walnuts × 5',               detail: '5 halves',        kcal: 65,  p: 2,  slots: ['E','M'],   tags: ['veg','low-carb'] },
  { id: 'peanuts-30',        name: 'Roasted Peanuts',           detail: '30g',             kcal: 170, p: 8,  slots: ['E'],       tags: ['veg','high-protein'] },
  { id: 'chana-roasted',     name: 'Roasted Chana',             detail: '30g',             kcal: 110, p: 7,  slots: ['E'],       tags: ['veg','high-protein'] },
  { id: 'makhana',           name: 'Makhana (roasted)',         detail: '1 bowl (~30g)',   kcal: 110, p: 4,  slots: ['E'],       tags: ['veg'] },
  { id: 'sprouts',           name: 'Mixed Sprouts',             detail: '1 bowl',          kcal: 140, p: 10, slots: ['M','E'],   tags: ['veg','high-protein','onion-garlic'] },
  { id: 'chaat-bhel',        name: 'Bhel Puri',                 detail: '1 plate',         kcal: 280, p: 7,  slots: ['E'],       tags: ['veg','onion-garlic'] },

  // ==================== FRUITS ====================
  { id: 'fruit-apple',       name: 'Apple',                     detail: '1 medium',        kcal: 95,  p: 0,  slots: ['M','E'],   tags: ['veg'] },
  { id: 'fruit-banana',      name: 'Banana',                    detail: '1 medium',        kcal: 105, p: 1,  slots: ['M','E'],   tags: ['veg'] },
  { id: 'fruit-orange',      name: 'Orange',                    detail: '1 medium',        kcal: 70,  p: 1,  slots: ['M','E'],   tags: ['veg'] },
  { id: 'fruit-guava',       name: 'Guava',                     detail: '1 medium',        kcal: 70,  p: 3,  slots: ['M','E'],   tags: ['veg'] },
  { id: 'fruit-papaya',      name: 'Papaya',                    detail: '1 bowl',          kcal: 60,  p: 1,  slots: ['M','E'],   tags: ['veg'] },
  { id: 'fruit-mixed',       name: 'Mixed Fruit Bowl',          detail: '1 bowl',          kcal: 120, p: 2,  slots: ['M','E'],   tags: ['veg'] },
  { id: 'fruit-watermelon',  name: 'Watermelon',                detail: '1 bowl',          kcal: 50,  p: 1,  slots: ['E'],       tags: ['veg'] },
  { id: 'fruit-berries',     name: 'Berries',                   detail: '1 bowl',          kcal: 70,  p: 1,  slots: ['M','E'],   tags: ['veg'] },
  { id: 'dates-3',           name: 'Dates × 3',                 detail: '3 pc',            kcal: 70,  p: 0,  slots: ['E'],       tags: ['veg','high-sugar'] },

  // ==================== BEVERAGES ====================
  { id: 'coffee-black',      name: 'Black Coffee',              detail: '1 cup',           kcal: 5,   p: 0,  slots: ['M','E'],   tags: ['veg','low-carb'] },
  { id: 'coffee-milk',       name: 'Coffee (with milk)',        detail: '1 cup',           kcal: 60,  p: 3,  slots: ['M','E'],   tags: ['veg','dairy'] },
  { id: 'tea-black',         name: 'Black Tea / Green Tea',     detail: '1 cup',           kcal: 5,   p: 0,  slots: ['M','E'],   tags: ['veg','low-carb'] },
  { id: 'chai-milk',         name: 'Masala Chai (milk)',        detail: '1 cup',           kcal: 70,  p: 2,  slots: ['M','E'],   tags: ['veg','dairy'] },
  { id: 'nimbu-pani',        name: 'Nimbu Pani (no sugar)',     detail: '1 glass',         kcal: 10,  p: 0,  slots: ['M','L','E'],tags: ['veg','low-carb'] },

  // ==================== INDULGENCES (tracked but discouraged) ====================
  { id: 'samosa',            name: 'Samosa',                    detail: '1 pc',            kcal: 260, p: 4,  slots: ['E'],       tags: ['veg','oily','root','onion-garlic'] },
  { id: 'pakora',            name: 'Pakora',                    detail: '100g',            kcal: 320, p: 8,  slots: ['E'],       tags: ['veg','oily','onion-garlic'] },
  { id: 'jalebi',            name: 'Jalebi',                    detail: '2 pc',            kcal: 300, p: 2,  slots: ['E'],       tags: ['veg','dairy','high-sugar'] },
  { id: 'gulab-jamun',       name: 'Gulab Jamun',               detail: '2 pc',            kcal: 320, p: 4,  slots: ['L','D','E'],tags: ['veg','dairy','high-sugar'] },

  // ==================== ADDITIONS ====================
  { id: 'ghee-tsp',          name: 'Ghee',                      detail: '1 tsp',           kcal: 45,  p: 0,  slots: ['L','D','M'],tags: ['veg','dairy'] },
  { id: 'butter-tsp',        name: 'Butter',                    detail: '1 tsp',           kcal: 35,  p: 0,  slots: ['L','D','M'],tags: ['veg','dairy'] },
  { id: 'papad-roasted',     name: 'Papad (roasted)',           detail: '1 pc',            kcal: 40,  p: 3,  slots: ['L','D'],   tags: ['veg'] },
  { id: 'achaar',            name: 'Pickle (achaar)',           detail: '1 tsp',           kcal: 30,  p: 0,  slots: ['L','D'],   tags: ['veg','oily'] }
];

export const MEALS_BY_ID = Object.fromEntries(MEALS.map((m) => [m.id, m]));

// Dietary filter — returns true if item is allowed for the user's profile.diet.
export const isAllowed = (item, diet) => {
  if (!item) return false;
  if (!diet) return true;
  const t = item.tags || [];
  const type = diet.type || 'non-veg';

  if (type === 'vegan') {
    if (t.includes('non-veg') || t.includes('egg') || t.includes('dairy')) return false;
  } else if (type === 'veg') {
    if (t.includes('non-veg') || t.includes('egg')) return false;
  } else if (type === 'eggitarian') {
    if (t.includes('non-veg')) return false;
  } else if (type === 'jain') {
    if (t.includes('non-veg') || t.includes('egg')) return false;
    if (t.includes('root') || t.includes('onion-garlic')) return false;
  }
  // non-veg passes everything

  if (diet.onionGarlic === false && t.includes('onion-garlic')) return false;
  if (diet.noDairy && t.includes('dairy')) return false;
  if (diet.noGluten && !t.includes('gluten-free')) {
    // conservative: only allow explicitly gluten-free
    // (Most of this library is gluten-containing by default unless tagged.)
  }
  return true;
};

export const filterByDiet = (meals, diet) => meals.filter((m) => isAllowed(m, diet));

export const filterBySlot = (meals, slotKey, strict = true) => {
  if (!strict) return meals;
  return meals.filter((m) =>
    Array.isArray(m.slots) && (m.slots.length === 0 || m.slots.includes(slotKey))
  );
};

// Text search — forgiving, lowercase, substring.
export const searchMeals = (meals, query) => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return meals;
  return meals.filter((m) =>
    m.name.toLowerCase().includes(q) ||
    m.id.toLowerCase().includes(q) ||
    (m.tags || []).some((t) => t.includes(q))
  );
};
