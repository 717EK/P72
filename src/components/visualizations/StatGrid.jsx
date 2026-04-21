import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  scoreDay, kcalForDay, calcStreak, firstLoggedWeight, rollingAvg
} from '../../utils/scoring';
import { TOTAL_DAYS } from '../../utils/constants';
import './StatGrid.css';

export default function StatGrid() {
  const days = useAppStore((s) => s.days);
  const startDate = useAppStore((s) => s.startDate);
  const activeDay = useAppStore((s) => s.activeDay);
  const day = useAppStore((s) => s.getCurrentDay());
  const dayNum = useAppStore((s) => s.currentDayNumber());

  const sc = scoreDay(day);
  const kc = kcalForDay(day);
  const streak = calcStreak(days, activeDay);
  const firstW = firstLoggedWeight(days);
  const curW = day.metrics.weight;
  const wDelta = (firstW != null && curW != null)
    ? (curW - firstW)
    : null;
  const smoke7 = rollingAvg(days, startDate, activeDay, 'smoke', 7);
  const steps7 = rollingAvg(days, startDate, activeDay, 'steps', 7);

  const stats = [
    { lbl: 'DAY', val: `${dayNum} / ${TOTAL_DAYS}`, tone: '' },
    { lbl: 'COMPLIANCE', val: `${sc.pct}%`, tone: sc.pct >= 80 ? 'ok' : sc.pct >= 50 ? 'warn' : 'bad' },
    { lbl: 'KCAL LOGGED', val: kc, tone: (kc >= 1400 && kc <= 1650) ? 'ok' : kc > 1700 ? 'bad' : '' },
    { lbl: 'WEIGHT Δ', val: wDelta == null ? '—' : ((wDelta >= 0 ? '+' : '') + wDelta.toFixed(1) + ' KG'), tone: wDelta == null ? '' : wDelta < 0 ? 'ok' : wDelta > 0 ? 'bad' : '' },
    { lbl: 'STREAK', val: `${streak}D`, tone: streak >= 3 ? 'ok' : '' },
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
