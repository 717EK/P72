import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  scoreDay, kcalForDay, calcStreakForgiving,
  forgivenessRemaining, firstLoggedWeight, rollingAvg, proteinForDay
} from '../../utils/scoring';
import { TOTAL_DAYS } from '../../utils/constants';
import { calorieWindow, slotBudgets, proteinTargetG, ageFrom } from '../../utils/health';
import './StatGrid.css';

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

  const stats = [
    { lbl: 'DAY', val: `${dayNum} / ${TOTAL_DAYS}`, tone: '' },
    { lbl: 'COMPLIANCE', val: `${sc.pct}%`, tone: sc.pct >= 80 ? 'ok' : sc.pct >= 50 ? 'warn' : 'bad' },
    { lbl: `KCAL · ${kcalWin.lo}-${kcalWin.hi}`, val: kc, tone: kcalTone },
    { lbl: `PROTEIN · TGT ${proteinTarget}g`, val: `${pToday}g`, tone: pToday >= proteinTarget ? 'ok' : pToday >= proteinTarget * 0.8 ? 'warn' : '' },
    { lbl: 'WEIGHT Δ', val: wDelta == null ? '—' : ((wDelta >= 0 ? '+' : '') + wDelta.toFixed(1) + ' KG'), tone: wDelta == null ? '' : wDelta < 0 ? 'ok' : wDelta > 0 ? 'bad' : '' },
    { lbl: 'STREAK', val: `${streak}D`, tone: streak >= 3 ? 'ok' : '' },
    { lbl: 'SAVES LEFT 28D', val: `${savesLeft}/2`, tone: savesLeft === 0 ? 'bad' : savesLeft === 1 ? 'warn' : 'ok' },
    { lbl: 'SMOKE AVG 7D', val: smoke7 == null ? '—' : smoke7.toFixed(1), tone: smoke7 === 0 ? 'ok' : smoke7 > 5 ? 'bad' : smoke7 == null ? '' : 'warn' },
    { lbl: 'STEPS AVG 7D', val: steps7 == null ? '—' : Math.round(steps7).toLocaleString(), tone: (steps7 || 0) >= 8000 ? 'ok' : steps7 == null ? '' : 'bad' },
    { lbl: 'NIGHT RX', val: (day.skin.nightType || '—').slice(0, 4).toUpperCase(), tone: 'info' }
  ];

  return (
    <div className="stat-grid">
      {stats.map((s) => (
        <div key={s.lbl} className={`stat-cell tone-${s.tone}`}>
          <div className="stat-lbl">{s.lbl}</div>
          <div className="stat-val">{s.val}</div>
        </div>
      ))}
    </div>
  );
}
