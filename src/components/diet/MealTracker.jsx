import React from 'react';
import SwipeRow from '../ui/SwipeRow';
import Checkbox from '../ui/Checkbox';
import { MEAL_GROUPS } from '../../utils/constants';
import { useAppStore } from '../../store/useAppStore';

export default function MealTracker() {
  const day = useAppStore((s) => s.getCurrentDay());
  const setMeal = useAppStore((s) => s.setMeal);

  return (
    <div>
      {MEAL_GROUPS.map((group) => (
        <div key={group.id}>
          <div className="subhead">
            {group.title.toUpperCase()} // {group.range}
          </div>
          {group.items.map((item) => {
            const checked = !!day.meals[item.k];
            return (
              <SwipeRow
                key={item.k}
                checked={checked}
                onComplete={() => setMeal(item.k, true)}
                onMiss={() => setMeal(item.k, false)}
              >
                <Checkbox
                  label={item.t}
                  checked={checked}
                  meta={`${item.kc} KC`}
                  onToggle={() => setMeal(item.k, !checked)}
                />
              </SwipeRow>
            );
          })}
        </div>
      ))}
    </div>
  );
}
