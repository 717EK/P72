import React from 'react';
import Checkbox from '../ui/Checkbox';
import { PM_RETINOID, PM_NIACINAMIDE } from '../../utils/constants';
import { useAppStore } from '../../store/useAppStore';
import { nightRecommendation } from '../../utils/scoring';
import './PmRoutine.css';

export default function PmRoutine() {
  const day = useAppStore((s) => s.getCurrentDay());
  const togglePm = useAppStore((s) => s.toggleSkinPm);
  const setNight = useAppStore((s) => s.setNightType);
  const days = useAppStore((s) => s.days);
  const startDate = useAppStore((s) => s.startDate);
  const activeDay = useAppStore((s) => s.activeDay);

  const type = day.skin.nightType || 'niacinamide';
  const defs = type === 'retinoid' ? PM_RETINOID : PM_NIACINAMIDE;
  const rec = nightRecommendation(days, startDate, activeDay);

  return (
    <div>
      <div className="subhead">PM // Night routine</div>

      <div className="night-tabs">
        <button
          className={`ntab${type === 'retinoid' ? ' is-active' : ''}`}
          onClick={() => setNight('retinoid')}
        >
          <span className="ntab-t">RETINOID 2%</span>
          <span className="ntab-s">3x / WEEK</span>
        </button>
        <button
          className={`ntab${type === 'niacinamide' ? ' is-active' : ''}`}
          onClick={() => setNight('niacinamide')}
        >
          <span className="ntab-t">NIACINAMIDE 5%</span>
          <span className="ntab-s">ALT DAYS</span>
        </button>
      </div>

      <div className="night-rec">
        <span className="night-rec-l">RECOMMENDED TONIGHT</span>
        <span className="night-rec-v">{rec.label}</span>
        <span className="night-rec-r">// {rec.reason}</span>
      </div>

      {defs.map((item, idx) => (
        <Checkbox
          key={item.k}
          label={item.t}
          pill={item.pill}
          checked={!!day.skin.pm[item.k]}
          meta={`STEP ${idx + 1}`}
          onToggle={() => togglePm(item.k)}
        />
      ))}
    </div>
  );
}
