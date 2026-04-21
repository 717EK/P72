import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { blankDay, mergeDay } from '../utils/scoring';
import { todayKey, dateKey, parseKey, daysBetween } from '../utils/dates';
import { TOTAL_DAYS } from '../utils/constants';

const init = () => ({
  startDate: todayKey(),
  days: {},
  activeTab: 'dash',
  activeDay: todayKey(),
  bootedAt: Date.now()
});

const ensureDay = (state, key) => {
  if (!state.days[key]) {
    state.days[key] = blankDay();
  }
  return state.days[key];
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      ...init(),

      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveDay: (key) => set({ activeDay: key }),

      rolloverIfNeeded: () => {
        const today = todayKey();
        if (today !== get().activeDay) {
          set({ activeDay: today });
        }
        set((s) => {
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
        return daysBetween(parseKey(start), parseKey(key));
      },

      currentDayNumber: () => {
        const idx = get().dayIndexFor(get().activeDay);
        return Math.max(1, Math.min(idx + 1, TOTAL_DAYS));
      },

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
        return { days: { ...s.days, [key]: day } };
      }),

      resetAll: () => {
        set({ ...init(), startDate: todayKey(), activeDay: todayKey() });
      },

      importData: (payload) => {
        if (!payload || typeof payload !== 'object') return false;
        const { start, days } = payload;
        if (!start || !days || typeof days !== 'object') return false;
        set({ startDate: start, days, activeDay: todayKey(), activeTab: 'dash' });
        return true;
      },

      exportData: () => ({
        version: 1,
        exportedAt: new Date().toISOString(),
        start: get().startDate,
        days: get().days
      })
    }),
    {
      name: 'protocol72_store_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        startDate: s.startDate,
        days: s.days,
        activeTab: s.activeTab
      }),
      version: 1
    }
  )
);
