import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { parseKey, formatDate } from '../../utils/dates';
import Button from '../ui/Button';
import './PreStart.css';

const msToHms = (ms) => {
  if (ms <= 0) return { h: 0, m: 0, s: 0 };
  const total = Math.floor(ms / 1000);
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60
  };
};

export default function PreStart() {
  const profile = useAppStore((s) => s.profile);
  const startDate = useAppStore((s) => s.startDate);
  const startProtocol = useAppStore((s) => s.startProtocol);
  const rolloverIfNeeded = useAppStore((s) => s.rolloverIfNeeded);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // When the clock actually passes the start date → kick the main app to re-render.
  useEffect(() => {
    rolloverIfNeeded();
  }, [now, rolloverIfNeeded]);

  const target = parseKey(startDate);
  target.setHours(0, 0, 0, 0);
  const { h, m, s } = msToHms(target.getTime() - now);

  const startNow = () => {
    // Convert to a today-start instead of waiting.
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    startProtocol(key);
  };

  return (
    <div className="ps-shell">
      <div className="ps-card">
        <div className="ps-tag">PROTOCOL ARMED</div>
        <div className="ps-greet">
          {profile.name ? <>HOLD, <span className="u-ok">{profile.name.toUpperCase()}</span>.</> : <>HOLD.</>}
        </div>
        <div className="ps-sub">
          DAY 001 INITIATES {formatDate(target)} · 00:00
        </div>

        <div className="ps-countdown">
          <div className="ps-cnt-cell">
            <div className="ps-cnt-v u-tabular">{String(h).padStart(2, '0')}</div>
            <div className="ps-cnt-l">HRS</div>
          </div>
          <div className="ps-cnt-sep">:</div>
          <div className="ps-cnt-cell">
            <div className="ps-cnt-v u-tabular">{String(m).padStart(2, '0')}</div>
            <div className="ps-cnt-l">MIN</div>
          </div>
          <div className="ps-cnt-sep">:</div>
          <div className="ps-cnt-cell">
            <div className="ps-cnt-v u-tabular">{String(s).padStart(2, '0')}</div>
            <div className="ps-cnt-l">SEC</div>
          </div>
        </div>

        <p className="ps-fine">
          The 120-day clock starts at midnight. Use the hours before to prep:
          stock the fridge, charge your phone, plan tomorrow's meals.
        </p>

        <div className="ps-actions">
          <Button onClick={startNow} tone="primary" fullWidth>
            ▶ START TODAY INSTEAD
          </Button>
        </div>
      </div>
    </div>
  );
}
