import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { blankDay, mergeDay } from '../utils/scoring';
import { todayKey, dateKey, parseKey, daysBetween } from '../utils/dates';
import { TOTAL_DAYS } from '../utils/constants';

const emptyProfile = () => ({
  name: '',
  sex: 'male',              // 'male' | 'female' | 'other'
  dob: null,                // 'YYYY-MM-DD'
  heightCm: null,
  startWeightKg: null,
  goalWeightKg: 72,         // the app's namesake, editable
  smokeBaseline: null,      // cigs/day at start, for taper tracking
  activity: 'light',        // key into ACTIVITY_FACTORS
  units: 'metric',          // 'metric' | 'imperial' — for display only
  intensity: 'standard',    // 'standard' (-500) | 'aggressive' (-750 kcal deficit)
  diet: {                   // dietary preferences — filters meal library
    type: 'non-veg',        // 'non-veg' | 'eggitarian' | 'veg' | 'vegan' | 'jain'
    onionGarlic: true,      // false → hide onion-garlic items
    noDairy: false,
    noGluten: false,
    allergies: []           // free-form ingredient names, for future use
  }
});

// Favorites + custom meals live alongside the profile but are kept separate
// so they don't get overwritten when the user edits profile fields.
const emptyMealPrefs = () => ({
  favorites: [],    // array of meal ids (from library or custom)
  customMeals: []   // [{ id: 'custom_xxx', name, kcal, p, slots:[...] }]
});

const init = () => ({
  // Gate: app is locked in welcome flow until true.
  onboarded: false,
  profile: emptyProfile(),
  mealPrefs: emptyMealPrefs(),

  // null until the user presses START PROTOCOL. App shows a "pre-start" state
  // between finishing onboarding and the first day if they start "tomorrow".
  startDate: null,

  days: {},
  activeTab: 'dash',
  activeDay: todayKey(),
  bootedAt: Date.now(),

  // Health integration state (last import summary).
  healthSync: {
    lastImportedAt: null,   // ISO string
    lastImportedDays: 0,    // how many day-keys updated
    source: null            // 'auto-export' | 'xml' | 'manual'
  }
});

export const useAppStore = create(
  persist(
    (set, get) => ({
      ...init(),

      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveDay: (key) => set({ activeDay: key }),

      // ---------- Onboarding ----------
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      // Start the protocol. `when` is a date key 'YYYY-MM-DD'.
      // If `when` is today or in the past, activeDay becomes today (Day 1+).
      // If `when` is in the future, activeDay stays on today but currentDayNumber()
      // reports 0 (= "pre-start") until the calendar reaches the start date.
      startProtocol: (when) => {
        const start = when || todayKey();
        set((s) => {
          const days = { ...s.days };
          if (!days[start]) days[start] = blankDay();
          const todayK = todayKey();
          if (start <= todayK && !days[todayK]) days[todayK] = blankDay();
          return {
            onboarded: true,
            startDate: start,
            activeDay: todayK,
            activeTab: 'dash'
          };
        });
      },

      // ---------- Day navigation ----------
      rolloverIfNeeded: () => {
        const today = todayKey();
        if (today !== get().activeDay) {
          set({ activeDay: today });
        }
        set((s) => {
          if (!s.onboarded || !s.startDate) return s;
          // Only seed a blank day once the protocol has actually begun.
          if (today < s.startDate) return s;
          if (!s.days[today]) {
            return { days: { ...s.days, [today]: blankDay() } };
          }
          return s;
        });
      },

      getDay: (key) => get().days[key] || null,

      getCurrentDay: () => {
        const key = get().activeDay;
        const existing = get().days[key];
        return existing ? mergeDay(blankDay(), existing) : blankDay();
      },

      dayIndexFor: (key) => {
        const start = get().startDate;
        if (!start) return -1;
        return daysBetween(parseKey(start), parseKey(key));
      },

      // Returns 0 for pre-start, otherwise 1..TOTAL_DAYS (clamped).
      currentDayNumber: () => {
        const start = get().startDate;
        if (!start) return 0;
        const idx = get().dayIndexFor(get().activeDay);
        if (idx < 0) return 0;
        return Math.max(1, Math.min(idx + 1, TOTAL_DAYS));
      },

      isPreStart: () => {
        const s = get();
        return s.onboarded && s.startDate && s.startDate > todayKey();
      },

      // ---------- Day mutations ----------
      toggleSkinAm: (k) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        day.skin.am[k] = !day.skin.am[k];
        return { days: { ...s.days, [key]: day } };
      }),

      toggleSkinPm: (k) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        day.skin.pm[k] = !day.skin.pm[k];
        return { days: { ...s.days, [key]: day } };
      }),

      setNightType: (type) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        day.skin.nightType = type;
        return { days: { ...s.days, [key]: day } };
      }),

      // ---------- Meal slot actions (new model) ----------
      // day.meals shape: { M: [...], L: [...], E: [...], D: [...] }
      // each entry: { id, name, kcal, p, qty }
      // qty defaults to 1; can be adjusted.

      addMealItem: (slot, item, qty = 1) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        if (!day.meals[slot]) day.meals[slot] = [];
        // If same id already present in slot, bump qty instead of duplicating.
        const existing = day.meals[slot].find((e) => e.id === item.id);
        if (existing) {
          existing.qty = +(existing.qty + qty).toFixed(2);
        } else {
          day.meals[slot].push({
            id: item.id,
            name: item.name,
            detail: item.detail,
            kcal: item.kcal,
            p: item.p,
            qty
          });
        }
        return { days: { ...s.days, [key]: day } };
      }),

      removeMealItem: (slot, id) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        if (!day.meals[slot]) return s;
        day.meals[slot] = day.meals[slot].filter((e) => e.id !== id);
        return { days: { ...s.days, [key]: day } };
      }),

      setMealItemQty: (slot, id, qty) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        if (!day.meals[slot]) return s;
        const item = day.meals[slot].find((e) => e.id === id);
        if (!item) return s;
        if (qty <= 0) {
          day.meals[slot] = day.meals[slot].filter((e) => e.id !== id);
        } else {
          item.qty = +qty.toFixed(2);
        }
        return { days: { ...s.days, [key]: day } };
      }),

      clearMealSlot: (slot) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        day.meals[slot] = [];
        return { days: { ...s.days, [key]: day } };
      }),

      // ---------- Meal prefs (favorites + custom library) ----------
      toggleFavorite: (id) => set((s) => {
        const fav = s.mealPrefs.favorites;
        const next = fav.includes(id) ? fav.filter((x) => x !== id) : [...fav, id];
        return { mealPrefs: { ...s.mealPrefs, favorites: next } };
      }),

      addCustomMeal: (meal) => set((s) => {
        const id = meal.id || `custom_${Date.now()}`;
        const entry = {
          id,
          name: meal.name || 'Custom item',
          detail: meal.detail || '',
          kcal: Math.round(+meal.kcal || 0),
          p: Math.round(+meal.p || 0),
          slots: meal.slots || ['M', 'L', 'E', 'D'],
          tags: meal.tags || ['veg'],
          custom: true
        };
        return {
          mealPrefs: {
            ...s.mealPrefs,
            customMeals: [...s.mealPrefs.customMeals, entry]
          }
        };
      }),

      removeCustomMeal: (id) => set((s) => ({
        mealPrefs: {
          ...s.mealPrefs,
          customMeals: s.mealPrefs.customMeals.filter((m) => m.id !== id),
          favorites: s.mealPrefs.favorites.filter((x) => x !== id)
        }
      })),

      toggleFlag: (k) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        day.flags[k] = !day.flags[k];
        return { days: { ...s.days, [key]: day } };
      }),

      toggleActivity: (k) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        day.activity[k] = !day.activity[k];
        return { days: { ...s.days, [key]: day } };
      }),

      setMetric: (k, v) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        day.metrics[k] = (v === null || v === '' || Number.isNaN(v)) ? null : Number(v);
        return { days: { ...s.days, [key]: day } };
      }),

      // ---------- Apple Health import ----------
      // `rows` is array of { key: 'YYYY-MM-DD', steps: number }.
      // Strategy: merge steps into existing day records, only overwriting if
      // the incoming number is greater (Health is usually more accurate than
      // a user's mid-day manual estimate).
      importHealthRows: (rows, source = 'auto-export') => {
        if (!Array.isArray(rows) || !rows.length) return 0;
        let touched = 0;
        set((s) => {
          const days = { ...s.days };
          for (const { key, steps } of rows) {
            if (!key || !Number.isFinite(steps)) continue;
            // Don't write days that are before the protocol started or after today
            if (s.startDate && key < s.startDate) continue;
            if (key > todayKey()) continue;
            const existing = days[key] ? mergeDay(blankDay(), days[key]) : blankDay();
            const prev = existing.metrics.steps || 0;
            if (steps > prev) {
              existing.metrics.steps = steps;
              days[key] = existing;
              touched++;
            }
          }
          return {
            days,
            healthSync: {
              lastImportedAt: new Date().toISOString(),
              lastImportedDays: touched,
              source
            }
          };
        });
        return touched;
      },

      // ---------- Misc ----------
      resetAll: () => {
        set({ ...init() });
      },

      importData: (payload) => {
        if (!payload || typeof payload !== 'object') return false;
        const { start, days, profile, onboarded, mealPrefs } = payload;
        if (!days || typeof days !== 'object') return false;
        set({
          startDate: start || null,
          days,
          profile: profile ? { ...emptyProfile(), ...profile } : emptyProfile(),
          mealPrefs: mealPrefs ? { ...emptyMealPrefs(), ...mealPrefs } : emptyMealPrefs(),
          onboarded: onboarded ?? !!start,
          activeDay: todayKey(),
          activeTab: 'dash'
        });
        return true;
      },

      exportData: () => ({
        version: 3,
        exportedAt: new Date().toISOString(),
        start: get().startDate,
        profile: get().profile,
        mealPrefs: get().mealPrefs,
        onboarded: get().onboarded,
        days: get().days
      })
    }),
    {
      name: 'protocol72_store_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        onboarded: s.onboarded,
        profile: s.profile,
        mealPrefs: s.mealPrefs,
        startDate: s.startDate,
        days: s.days,
        activeTab: s.activeTab,
        healthSync: s.healthSync
      }),
      version: 3,
      migrate: (persisted, fromVersion) => {
        let p = { ...(persisted || {}) };

        // v1 → v2: add profile, make startDate nullable, seed healthSync
        if (fromVersion < 2) {
          p = {
            ...p,
            onboarded: !!p.startDate,
            profile: emptyProfile(),
            healthSync: {
              lastImportedAt: null,
              lastImportedDays: 0,
              source: null
            }
          };
        }

        // v2 → v3: intensity + diet on profile, mealPrefs added,
        // boolean meals converted to slot-array shape.
        if (fromVersion < 3) {
          // Ensure profile has the new keys without clobbering existing values
          p.profile = {
            ...emptyProfile(),
            ...(p.profile || {}),
            intensity: p.profile?.intensity || 'standard',
            diet: p.profile?.diet || emptyProfile().diet
          };
          p.mealPrefs = p.mealPrefs || emptyMealPrefs();

          // Boolean → slot-array migration.
          // Old meal keys and their slots + rough macros (from old constants).
          // This preserves historical logging without pretending accuracy we don't have.
          const LEGACY_MAP = {
            m_eggs:   { slot: 'M', name: '3 whole eggs',         kcal: 210, p: 18 },
            m_fruit:  { slot: 'M', name: '1 whole fruit',        kcal: 70,  p: 1  },
            m_drink:  { slot: 'M', name: 'Black coffee / green tea', kcal: 5, p: 0 },
            l_protein:{ slot: 'L', name: '150g protein',         kcal: 240, p: 28 },
            l_carb:   { slot: 'L', name: '1 roti / small rice',  kcal: 140, p: 3  },
            l_veg:    { slot: 'L', name: 'Vegetables / salad',   kcal: 90,  p: 3  },
            e_almond: { slot: 'E', name: '8–10 almonds',         kcal: 75,  p: 3  },
            e_tea:    { slot: 'E', name: 'Green tea',            kcal: 0,   p: 0  },
            d_protein:{ slot: 'D', name: '150g protein',         kcal: 240, p: 28 },
            d_veg:    { slot: 'D', name: 'Vegetables',           kcal: 150, p: 4  }
          };

          if (p.days && typeof p.days === 'object') {
            const migrated = {};
            for (const [dayKey, day] of Object.entries(p.days)) {
              if (!day) continue;
              const m = day.meals || {};
              // Detect shape: if it already has M/L/E/D keys as arrays, skip.
              const isNewShape =
                Array.isArray(m.M) || Array.isArray(m.L) ||
                Array.isArray(m.E) || Array.isArray(m.D);

              if (isNewShape) {
                migrated[dayKey] = day;
                continue;
              }

              const newMeals = { M: [], L: [], E: [], D: [] };
              for (const [k, v] of Object.entries(m)) {
                if (!v) continue;
                const mapEntry = LEGACY_MAP[k];
                if (!mapEntry) continue;
                newMeals[mapEntry.slot].push({
                  id: `legacy_${k}`,
                  name: mapEntry.name,
                  detail: 'migrated from v2',
                  kcal: mapEntry.kcal,
                  p: mapEntry.p,
                  qty: 1
                });
              }
              // Drop the retired proteinHit flag if present
              const { proteinHit, ...cleanFlags } = (day.flags || {});
              migrated[dayKey] = {
                ...day,
                meals: newMeals,
                flags: cleanFlags,
                note: day.note || ''
              };
            }
            p.days = migrated;
          }
        }

        return p;
      }
    }
  )
);
