import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { scoreDay } from '../../utils/scoring';
import ComplianceRing from './ComplianceRing';
import TransformationMatrix from './TransformationMatrix';
import DataCharts from './DataCharts';
import MilestoneTimeline from './MilestoneTimeline';
import StatGrid from './StatGrid';
import DayRecapModal from '../layout/DayRecapModal';
import './DashView.css';

export default function DashView() {
  const day = useAppStore((s) => s.getCurrentDay());
  const dayNum = useAppStore((s) => s.currentDayNumber());
  const [recapKey, setRecapKey] = useState(null);
  const sc = scoreDay(day);

  return (
    <section className="dash">
      <div className="section-title">
        <span>DASH // COMMAND</span>
        <span className="tag">LIVE</span>
      </div>

      <div className="dash-hero">
        <ComplianceRing
          pct={sc.pct}
          label={`DAY ${String(dayNum).padStart(3, '0')}`}
          sub={`${sc.pts} / ${sc.max} PTS`}
        />
        <div className="dash-hero-txt">
          <div className="dash-hero-l">TODAY</div>
          <div className={`dash-hero-m ${sc.pct >= 80 ? 'u-ok' : sc.pct >= 50 ? 'u-warn' : 'u-bad'}`}>
            {sc.pct >= 90 ? 'LOCKED IN' : sc.pct >= 70 ? 'ON TARGET' : sc.pct >= 50 ? 'RECOVERABLE' : sc.pct > 0 ? 'UNDER THRESHOLD' : 'UNLOGGED'}
          </div>
          <div className="dash-hero-sub">
            {sc.pct >= 90 && 'Full-stack compliance.'}
            {sc.pct >= 70 && sc.pct < 90 && 'Maintain — push last items.'}
            {sc.pct >= 50 && sc.pct < 70 && 'Deficit flagged. Close remaining inputs.'}
            {sc.pct > 0 && sc.pct < 50 && 'Critical shortfall. Salvage day.'}
            {sc.pct === 0 && 'Begin logging. Time is the weapon.'}
          </div>
        </div>
      </div>

      <StatGrid />

      <TransformationMatrix onDayClick={(k) => setRecapKey(k)} />

      <DataCharts />

      <MilestoneTimeline />

      {recapKey && <DayRecapModal dayKey={recapKey} onClose={() => setRecapKey(null)} />}
    </section>
  );
}
