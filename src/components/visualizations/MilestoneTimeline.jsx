import React from 'react';
import { MILESTONES } from '../../utils/constants';
import { useAppStore } from '../../store/useAppStore';
import { daysBetween, parseKey } from '../../utils/dates';
import './MilestoneTimeline.css';

export default function MilestoneTimeline() {
  const startDate = useAppStore((s) => s.startDate);
  const activeDay = useAppStore((s) => s.activeDay);
  const idx = daysBetween(parseKey(startDate), parseKey(activeDay));
  const curWeek = Math.floor(idx / 7) + 1;

  return (
    <div className="tl-wrap">
      <div className="section-title">
        <span>16_WEEK_MILESTONE_TIMELINE</span>
        <span className="tag">WK {curWeek}</span>
      </div>
      <div className="tl-grid">
        {MILESTONES.map((ms) => {
          const reached = curWeek >= ms.wk;
          const current = curWeek === ms.wk;
          return (
            <div
              key={ms.wk}
              className={`tl-item${reached ? ' is-reached' : ''}${current ? ' is-current' : ''}`}
            >
              <div className="tl-wk">WEEK {String(ms.wk).padStart(2, '0')}</div>
              <div className="tl-desc">{ms.d}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
