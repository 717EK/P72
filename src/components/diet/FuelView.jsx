import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { kcalForDay, proteinForDay } from '../../utils/scoring';
import { calorieWindow, slotBudgets, ageFrom, proteinTargetG } from '../../utils/health';
import { MEAL_SLOTS } from '../../data/indianMeals';
import MealSlotCard from './MealSlotCard';
import DietFlags from './DietFlags';

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

  const kcalTone =
    kcTotal === 0 ? '' :
    kcTotal >= win.lo && kcTotal <= win.hi ? 'ok' :
    kcTotal > win.hi + 150 ? 'bad' : 'warn';

  return (
    <section>
      <div className="section-title">
        <span>FUEL // DIET</span>
        <span className={`tag ${kcalTone}`}>
          {kcTotal} / {win.lo}–{win.hi} KC · {pTotal}/{proteinGoal}g P
        </span>
      </div>

      <div style={{ padding: '4px 18px 8px', fontSize: 10, color: 'var(--mute)', letterSpacing: '0.2em', fontWeight: 700 }}>
        INTENSITY: {profile.intensity === 'aggressive' ? '↓ 750 KC (AGGRESSIVE)' : '↓ 500 KC (STANDARD)'}
        {profile.diet?.type && ` · ${profile.diet.type.toUpperCase()}`}
        {profile.diet?.onionGarlic === false && ' · NO-ONION-GARLIC'}
      </div>

      {MEAL_SLOTS.map((s) => (
        <MealSlotCard
          key={s.k}
          slot={s.k}
          title={s.title}
          budget={budgets[s.k]}
        />
      ))}

      <DietFlags />
    </section>
  );
}
