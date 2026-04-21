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
  units: 'metric'           // 'metric' | 'imperial' — for display only
});

const init = () => ({
  // Gate: app is locked in welcome flow until true.
  onboarded: false,
  profile: emptyProfile(),

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

      setMeal: (k, v) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        day.meals[k] = v;
        return { days: { ...s.days, [key]: day } };
      }),

      toggleMeal: (k) => set((s) => {
        const key = s.activeDay;
        const day = s.days[key] ? mergeDay(blankDay(), s.days[key]) : blankDay();
        day.meals[k] = !day.meals[k];
        return { days: { ...s.days, [key]: day } };
      }),

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
        // Auto-derive the proteinHit flag from grams logged vs. target
        if (k === 'proteinG') {
          const target = Math.round((s.profile.startWeightKg || 70) * 1.8);
          day.flags.proteinHit = (v != null && Number(v) >= target);
        }
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
        const { start, days, profile, onboarded } = payload;
        if (!days || typeof days !== 'object') return false;
        set({
          startDate: start || null,
          days,
          profile: profile ? { ...emptyProfile(), ...profile } : emptyProfile(),
          onboarded: onboarded ?? !!start,
          activeDay: todayKey(),
          activeTab: 'dash'
        });
        return true;
      },

      exportData: () => ({
        version: 2,
        exportedAt: new Date().toISOString(),
        start: get().startDate,
        profile: get().profile,
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
        startDate: s.startDate,
        days: s.days,
        activeTab: s.activeTab,
        healthSync: s.healthSync
      }),
      version: 2,
      // Migrate v1 (no profile, startDate always set) to v2 (profile, nullable startDate)
      migrate: (persisted, fromVersion) => {
        if (fromVersion < 2) {
          return {
            ...persisted,
            onboarded: !!persisted?.startDate,
            profile: emptyProfile(),
            healthSync: {
              lastImportedAt: null,
              lastImportedDays: 0,
              source: null
            }
          };
        }
        return persisted;
      }
    }
  )
);
