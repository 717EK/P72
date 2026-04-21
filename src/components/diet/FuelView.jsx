import React from 'react';
import MealTracker from './MealTracker';
import DietFlags from './DietFlags';
import { useAppStore } from '../../store/useAppStore';
import { kcalForDay, mealProgress } from '../../utils/scoring';

export default function FuelView() {
  const day = useAppStore((s) => s.getCurrentDay());
  const kc = kcalForDay(day);
  const { done, max } = mealProgress(day);
  const kcalTone = kc >= 1400 && kc <= 1650 ? 'ok' : kc > 1700 ? 'bad' : kc === 0 ? '' : 'warn';

  return (
    <section>
      <div className="section-title">
        <span>FUEL // DIET_COMPLIANCE</span>
        <span className={`tag ${kcalTone}`}>{kc} / 1500–1600 KCAL · {done}/{max}</span>
      </div>
      <MealTracker />
      <DietFlags />
    </section>
  );
}
