import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { kcalForDay, proteinForDay } from '../../utils/scoring';
import { calorieWindow, slotBudgets, ageFrom, proteinTargetG } from '../../utils/health';
import { MEAL_SLOTS } from '../../data/indianMeals';
import MealSlotCard from './MealSlotCard';
import DietFlags from './DietFlags';
import './FuelView.css';

const container = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.02 } }
};
const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
};

export default function FuelView() {
  const day = useAppStore((s) => s.getCurrentDay());
  const profile = useAppStore((s) => s.profile);

  const age = ageFrom(profile.dob);
  const pForWindow = {
    sex: profile.sex, weightKg: profile.startWeightKg,
    heightCm: profile.heightCm, ageYears: age,
    activity: profile.activity, intensity: profile.intensity
  };
  const win = calorieWindow(pForWindow);
  const budgets = slotBudgets(pForWindow);
  const proteinGoal = proteinTargetG({ weightKg: profile.startWeightKg });

  const kcTotal = kcalForDay(day);
  const pTotal = proteinForDay(day);

  // Fill percentages clamped at 120% so the bars can visibly overshoot
  const kcPct = Math.min(120, (kcTotal / win.center) * 100);
  const pPct = Math.min(120, (pTotal / proteinGoal) * 100);

  const kcTone =
    kcTotal === 0 ? '' :
    (kcTotal >= win.lo && kcTotal <= win.hi) ? 'ok' :
    kcTotal > win.hi + 150 ? 'bad' : 'warn';
  const pTone =
    pTotal === 0 ? '' :
    pTotal >= proteinGoal ? 'ok' :
    pTotal >= proteinGoal * 0.8 ? 'warn' : '';

  const intensityLbl = profile.intensity === 'aggressive' ? 'AGGRESSIVE · −750 KC' : 'STANDARD · −500 KC';
  const dietLbl = (profile.diet?.type || 'non-veg').toUpperCase()
    + (profile.diet?.onionGarlic === false ? ' · NO O/G' : '')
    + (profile.diet?.noDairy ? ' · NO DAIRY' : '');

  return (
    <motion.section variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="section-title">
        <span>FUEL // DIET</span>
        <span className="tag">LIVE</span>
      </motion.div>

      {/* Redesigned header — dual stacked progress bars */}
      <motion.div variants={item} className="fh">
        <div className="fh-tags">
          <span className="fh-tag fh-tag-int">{intensityLbl}</span>
          <span className="fh-tag">{dietLbl}</span>
        </div>

        <div className="fh-row">
          <div className="fh-row-l">
            <div className="fh-row-lbl">KCAL</div>
            <div className={`fh-row-v u-tabular tone-${kcTone}`}>
              {kcTotal}
              <span className="fh-row-v-s"> / {win.lo}–{win.hi}</span>
            </div>
          </div>
          <div className="fh-row-r">
            <div className="fh-bar">
              <div className={`fh-bar-fill tone-${kcTone}`} style={{ width: `${Math.min(100, kcPct)}%` }} />
              {kcPct > 100 && <div className="fh-bar-over" style={{ width: `${Math.min(100, kcPct - 100)}%` }} />}
              {/* Target band marker — shows the sweet-spot zone */}
              <div className="fh-bar-mark" style={{
                left: `${(win.lo / win.center) * 50}%`,
                width: `${((win.hi - win.lo) / win.center) * 50}%`
              }} />
            </div>
          </div>
        </div>

        <div className="fh-row">
          <div className="fh-row-l">
            <div className="fh-row-lbl">PROTEIN</div>
            <div className={`fh-row-v u-tabular tone-${pTone}`}>
              {pTotal}g
              <span className="fh-row-v-s"> / {proteinGoal}g</span>
            </div>
          </div>
          <div className="fh-row-r">
            <div className="fh-bar">
              <div className={`fh-bar-fill tone-${pTone}`} style={{ width: `${Math.min(100, pPct)}%` }} />
              {pPct > 100 && <div className="fh-bar-over" style={{ width: `${Math.min(100, pPct - 100)}%` }} />}
            </div>
          </div>
        </div>
      </motion.div>

      {MEAL_SLOTS.map((s) => (
        <motion.div key={s.k} variants={item}>
          <MealSlotCard slot={s.k} title={s.title} budget={budgets[s.k]} />
        </motion.div>
      ))}

      <motion.div variants={item}>
        <DietFlags />
      </motion.div>
    </motion.section>
  );
}
