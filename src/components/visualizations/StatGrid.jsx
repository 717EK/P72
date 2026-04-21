import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  scoreDay, kcalForDay, calcStreakForgiving,
  forgivenessRemaining, firstLoggedWeight, rollingAvg, proteinForDay
} from '../../utils/scoring';
import { TOTAL_DAYS } from '../../utils/constants';
import { calorieWindow, slotBudgets, proteinTargetG, ageFrom } from '../../utils/health';
import { addDays, dateKey, parseKey } from '../../utils/dates';
import './StatGrid.css';

// Last 7 days of compliance %, oldest → newest, for the mini bar chart.
function useLast7Compliance(days, activeDay, scoreOptions) {
  return useMemo(() => {
    const out = [];
    const today = parseKey(activeDay);
    for (let i = 6; i >= 0; i--) {
      const k = dateKey(addDays(today, -i));
      const sc = scoreDay(days[k], scoreOptions);
      out.push({ k, pct: sc.pct });
    }
    return out;
  }, [days, activeDay, scoreOptions]);
}

export default function StatGrid() {
  const days = useAppStore((s) => s.days);
  const startDate = useAppStore((s) => s.startDate);
  const activeDay = useAppStore((s) => s.activeDay);
  const day = useAppStore((s) => s.getCurrentDay());
  const dayNum = useAppStore((s) => s.currentDayNumber());
  const profile = useAppStore((s) => s.profile);

  const age = ageFrom(profile?.dob);
  const pForWindow = {
    sex: profile?.sex, weightKg: profile?.startWeightKg,
    heightCm: profile?.heightCm, ageYears: age,
    activity: profile?.activity, intensity: profile?.intensity
  };
  const kcalWin = calorieWindow(pForWindow);
  const budgets = slotBudgets(pForWindow);
  const proteinTarget = proteinTargetG({ weightKg: profile?.startWeightKg });
  const scoreOptions = { slotBudgets: budgets, proteinTarget };

  const sc = scoreDay(day, scoreOptions);
  const kc = kcalForDay(day);
  const pToday = proteinForDay(day);

  const streak = calcStreakForgiving(days, activeDay, { scoreOptions });
  const savesLeft = forgivenessRemaining(days, activeDay, { scoreOptions });

  const baselineW = profile?.startWeightKg || firstLoggedWeight(days);
  const curW = day.metrics.weight;
  const wDelta = (baselineW != null && curW != null) ? (curW - baselineW) : null;

  const smoke7 = rollingAvg(days, startDate, activeDay, 'smoke', 7);
  const steps7 = rollingAvg(days, startDate, activeDay, 'steps', 7);

  const kcalTone =
    kc === 0 ? '' :
    (kc >= kcalWin.lo && kc <= kcalWin.hi) ? 'ok' :
    kc > kcalWin.hi + 150 ? 'bad' : 'warn';

  const last7 = useLast7Compliance(days, activeDay, scoreOptions);

  // --- Primary stats (3 big) ---
  const primary = [
    {
      lbl: 'KCAL TODAY',
      val: kc,
      sub: `/ ${kcalWin.lo}–${kcalWin.hi}`,
      tone: kcalTone
    },
    {
      lbl: 'PROTEIN',
      val: `${pToday}g`,
      sub: `/ ${proteinTarget}g target`,
      tone: pToday >= proteinTarget ? 'ok' : pToday >= proteinTarget * 0.8 ? 'warn' : ''
    },
    {
      lbl: 'WEIGHT Δ',
      val: wDelta == null ? '—' : `${wDelta >= 0 ? '+' : ''}${wDelta.toFixed(1)}`,
      sub: wDelta == null ? 'LOG WEIGHT' : 'KG FROM START',
      tone: wDelta == null ? '' : wDelta < 0 ? 'ok' : wDelta > 0 ? 'bad' : ''
    }
  ];

  // --- Secondary stats (dense grid) ---
  const secondary = [
    { lbl: 'DAY',            val: `${dayNum}/${TOTAL_DAYS}`, tone: '' },
    { lbl: 'STREAK',         val: `${streak}D`, tone: streak >= 3 ? 'ok' : '' },
    { lbl: 'SAVES 28D',      val: `${savesLeft}/2`, tone: savesLeft === 0 ? 'bad' : savesLeft === 1 ? 'warn' : 'ok' },
    { lbl: 'SMOKE 7D',       val: smoke7 == null ? '—' : smoke7.toFixed(1), tone: smoke7 === 0 ? 'ok' : smoke7 > 5 ? 'bad' : smoke7 == null ? '' : 'warn' },
    { lbl: 'STEPS 7D',       val: steps7 == null ? '—' : `${Math.round(steps7/1000)}k`, tone: (steps7 || 0) >= 8000 ? 'ok' : steps7 == null ? '' : 'bad' },
    { lbl: 'NIGHT RX',       val: (day.skin.nightType || '—').slice(0, 4).toUpperCase(), tone: 'info' }
  ];

  return (
    <>
      <div className="stat-primary">
        {primary.map((s) => (
          <div key={s.lbl} className={`stat-p tone-${s.tone}`}>
            <div className="stat-p-lbl">{s.lbl}</div>
            <div className="stat-p-val u-tabular">{s.val}</div>
            <div className="stat-p-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 7-day compliance sparkbar */}
      <div className="spark-wrap">
        <div className="spark-hdr">
          <span>LAST 7 DAYS · COMPLIANCE</span>
          <span className="spark-avg u-tabular">
            {(() => {
              const logged = last7.filter((d) => d.pct > 0);
              if (!logged.length) return '—';
              const avg = Math.round(logged.reduce((a, b) => a + b.pct, 0) / logged.length);
              return `AVG ${avg}%`;
            })()}
          </span>
        </div>
        <div className="spark-bars">
          {last7.map((d, i) => {
            const tone = d.pct >= 80 ? 'ok' : d.pct >= 50 ? 'warn' : d.pct > 0 ? 'bad' : 'empty';
            const isToday = i === last7.length - 1;
            const label = new Date(parseKey(d.k)).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1).toUpperCase();
            return (
              <div key={d.k} className="spark-col" title={`${d.k} · ${d.pct}%`}>
                <div className="spark-bar-wrap">
                  <div className={`spark-bar tone-${tone} ${isToday ? 'is-today' : ''}`}
                       style={{ height: `${Math.max(4, d.pct)}%` }} />
                </div>
                <div className={`spark-lbl ${isToday ? 'is-today' : ''}`}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stat-grid">
        {secondary.map((s) => (
          <div key={s.lbl} className={`stat-cell tone-${s.tone}`}>
            <div className="stat-lbl">{s.lbl}</div>
            <div className="stat-val u-tabular">{s.val}</div>
          </div>
        ))}
      </div>
    </>
  );
}
