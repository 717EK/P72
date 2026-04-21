import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { scoreDay } from '../../utils/scoring';
import { calorieWindow, slotBudgets, proteinTargetG, ageFrom } from '../../utils/health';
import ComplianceRing from './ComplianceRing';
import TransformationMatrix from './TransformationMatrix';
import DataCharts from './DataCharts';
import MilestoneTimeline from './MilestoneTimeline';
import StatGrid from './StatGrid';
import DayRecapModal from '../layout/DayRecapModal';
import './DashView.css';

// Stagger children on enter — 40ms between each section, subtle 6px rise.
const container = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 }
  }
};
const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
};

export default function DashView() {
  const day = useAppStore((s) => s.getCurrentDay());
  const dayNum = useAppStore((s) => s.currentDayNumber());
  const profile = useAppStore((s) => s.profile);
  const [recapKey, setRecapKey] = useState(null);

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

  const sc = scoreDay(day, scoreOptions);

  return (
    <motion.section
      className="dash"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="section-title">
        <span>DASH // COMMAND</span>
        <span className="tag">LIVE</span>
      </motion.div>

      <motion.div variants={item} className="dash-hero">
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
      </motion.div>

      <motion.div variants={item}><StatGrid /></motion.div>
      <motion.div variants={item}><TransformationMatrix onDayClick={(k) => setRecapKey(k)} /></motion.div>
      <motion.div variants={item}><DataCharts /></motion.div>
      <motion.div variants={item}><MilestoneTimeline /></motion.div>

      {recapKey && <DayRecapModal dayKey={recapKey} onClose={() => setRecapKey(null)} />}
    </motion.section>
  );
}
