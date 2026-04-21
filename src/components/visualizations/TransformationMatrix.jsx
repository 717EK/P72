import React, { useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TOTAL_DAYS, MILESTONES } from '../../utils/constants';
import { addDays, dateKey, parseKey, daysBetween } from '../../utils/dates';
import { scoreDay, complianceTier } from '../../utils/scoring';
import { calorieWindow, slotBudgets, proteinTargetG, ageFrom } from '../../utils/health';
import './TransformationMatrix.css';

const COLS = 18;
const ROWS = 7;

export default function TransformationMatrix({ onDayClick }) {
  const startDate = useAppStore((s) => s.startDate);
  const days = useAppStore((s) => s.days);
  const activeDay = useAppStore((s) => s.activeDay);
  const profile = useAppStore((s) => s.profile);
  const scrollerRef = useRef(null);

  // Pre-compute scoring options from profile so every cell scores with the
  // user's personalised rubric, not the conservative defaults.
  const scoreOptions = useMemo(() => {
    const age = ageFrom(profile?.dob);
    const pForWindow = {
      sex: profile?.sex, weightKg: profile?.startWeightKg,
      heightCm: profile?.heightCm, ageYears: age,
      activity: profile?.activity, intensity: profile?.intensity
    };
    return {
      slotBudgets: slotBudgets(pForWindow),
      proteinTarget: proteinTargetG({ weightKg: profile?.startWeightKg })
    };
  }, [profile]);

  if (!startDate) return null;
  const todayIdx = daysBetween(parseKey(startDate), parseKey(activeDay));

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const colWidth = el.scrollWidth / COLS;
    const targetCol = Math.floor(todayIdx / ROWS);
    const scrollTo = targetCol * colWidth - el.clientWidth / 2 + colWidth / 2;
    el.scrollTo({ left: Math.max(0, scrollTo), behavior: 'auto' });
  }, [todayIdx]);

  const milestoneForWeek = (w) => MILESTONES.find((m) => m.wk === w);
  const currentWeek = Math.min(17, Math.floor(todayIdx / 7)); // 0-indexed week column

  return (
    <div className="mx-wrap">
      <div className="mx-hdr">
        <span className="mx-hdr-t">TRANSFORMATION_MATRIX // 120 DAYS</span>
        <div className="mx-legend">
          <span><i className="dot d-full"/>≥90</span>
          <span><i className="dot d-high"/>≥70</span>
          <span><i className="dot d-mid"/>≥50</span>
          <span><i className="dot d-fail"/>&lt;50</span>
          <span><i className="dot d-empty"/>VOID</span>
        </div>
      </div>

      <div className="mx-scroll" ref={scrollerRef}>
        <div className="mx-grid" style={{ gridTemplateColumns: `repeat(${COLS}, 36px)` }}>
          {Array.from({ length: COLS }).map((_, c) => {
            const wk = c + 1;
            const ms = milestoneForWeek(wk);
            const isCur = c === currentWeek;
            // Every 4 weeks = approximate month boundary (start of W05, W09, W13, W17)
            const isMonthBoundary = c > 0 && c % 4 === 0;
            return (
              <div key={`wlbl-${c}`} className={`mx-wlbl${ms ? ' is-ms' : ''}${isCur ? ' is-cur' : ''}${isMonthBoundary ? ' is-mboundary' : ''}`}>
                <div className="mx-wn">W{String(wk).padStart(2, '0')}</div>
                {ms && <div className="mx-wm">★</div>}
              </div>
            );
          })}

          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => {
              const idx = c * ROWS + r;
              const k = `cell-${r}-${c}`;
              const isMonthBoundary = c > 0 && c % 4 === 0;
              if (idx >= TOTAL_DAYS) {
                return <div key={k} className={`mx-cell is-void${isMonthBoundary ? ' is-mboundary' : ''}`} />;
              }
              const cellDate = addDays(parseKey(startDate), idx);
              const ck = dateKey(cellDate);
              const dat = days[ck];
              const future = idx > todayIdx;
              const isToday = idx === todayIdx;
              let tier = 'empty';
              if (dat && !future) tier = complianceTier(scoreDay(dat, scoreOptions).pct);
              if (future) tier = 'future';
              return (
                <button
                  key={k}
                  className={`mx-cell tier-${tier}${isToday ? ' is-today' : ''}${isMonthBoundary ? ' is-mboundary' : ''}`}
                  onClick={() => onDayClick && onDayClick(ck)}
                  title={`Day ${idx + 1} · ${ck}`}
                  aria-label={`Day ${idx + 1}`}
                >
                  <span className="mx-cell-n">{idx + 1}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mx-foot">
        <span>DAY <b className="u-tabular u-ok">{Math.min(todayIdx + 1, TOTAL_DAYS)}</b> / 120</span>
        <span>WEEK <b className="u-tabular u-ok">{Math.min(Math.floor(todayIdx / 7) + 1, 18)}</b></span>
        <span>REMAINING <b className="u-tabular">{Math.max(0, TOTAL_DAYS - todayIdx - 1)}D</b></span>
      </div>
    </div>
  );
}
