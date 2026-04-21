import React, { useEffect, useRef, useState } from 'react';
import './ComplianceRing.css';

// Animated ring:
// - Circumference draws in from 0 to pct on mount + every pct change (300ms ease-out).
// - Number counts up to the target pct across 500ms.
// - When pct crosses milestone thresholds (70, 90, 100), the outer glow pulses once.
export default function ComplianceRing({ pct, label, sub }) {
  const R = 48;
  const C = 2 * Math.PI * R;
  const tone = pct >= 80 ? 'ok' : pct >= 50 ? 'warn' : pct > 0 ? 'bad' : 'dim';

  const [drawn, setDrawn] = useState(0);          // 0..pct — used for the arc
  const [display, setDisplay] = useState(0);      // 0..pct — used for the number
  const [pulseKey, setPulseKey] = useState(0);    // bumped when a milestone is newly crossed
  const prevPct = useRef(pct);

  // Animate the arc: 0 → pct on first mount, then smooth between updates.
  useEffect(() => {
    const start = drawn;
    const end = pct || 0;
    const dur = 300;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDrawn(start + (end - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  // Animate the number: count up / down to match pct.
  useEffect(() => {
    const start = display;
    const end = pct || 0;
    const dur = 500;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (end - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  // Milestone pulse: trigger when pct *newly* crosses 70, 90, or 100.
  useEffect(() => {
    const wasBelow = (threshold) => prevPct.current < threshold && pct >= threshold;
    if (wasBelow(100) || wasBelow(90) || wasBelow(70)) {
      setPulseKey((k) => k + 1);
    }
    prevPct.current = pct;
  }, [pct]);

  const offset = C - (drawn / 100) * C;

  return (
    <div className={`ring ring-${tone}`}>
      <div key={pulseKey} className={`ring-pulse ring-pulse-${tone}`} />
      <svg viewBox="0 0 120 120" className="ring-svg">
        <circle cx="60" cy="60" r={R} className="ring-track" />
        <circle
          cx="60"
          cy="60"
          r={R}
          className="ring-bar"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ring-inner">
        <div className="ring-pct u-tabular">{Math.round(display)}<span>%</span></div>
        <div className="ring-lbl">{label}</div>
        {sub && <div className="ring-sub">{sub}</div>}
      </div>
    </div>
  );
}
