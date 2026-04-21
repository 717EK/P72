import React from 'react';
import './ComplianceRing.css';

export default function ComplianceRing({ pct, label, sub }) {
  const R = 48;
  const C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C;
  const tone = pct >= 80 ? 'ok' : pct >= 50 ? 'warn' : pct > 0 ? 'bad' : 'dim';

  return (
    <div className={`ring ring-${tone}`}>
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
        <div className="ring-pct">{pct}<span>%</span></div>
        <div className="ring-lbl">{label}</div>
        {sub && <div className="ring-sub">{sub}</div>}
      </div>
    </div>
  );
}
