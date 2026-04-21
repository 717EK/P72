import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { kcalForSlot, proteinForSlot } from '../../utils/scoring';
import MealPickerSheet from './MealPickerSheet';
import './MealSlotCard.css';

export default function MealSlotCard({ slot, title, budget }) {
  const day = useAppStore((s) => s.getCurrentDay());
  const items = day.meals?.[slot] || [];
  const removeMealItem = useAppStore((s) => s.removeMealItem);
  const setMealItemQty = useAppStore((s) => s.setMealItemQty);
  const clearMealSlot = useAppStore((s) => s.clearMealSlot);

  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const wasInRange = useRef(false);

  const kc = kcalForSlot(day, slot);
  const p = proteinForSlot(day, slot);
  const pct = budget?.center ? Math.min(120, Math.round((kc / budget.center) * 100)) : 0;

  let tone = '';
  if (kc === 0) tone = '';
  else if (budget && kc >= budget.lo && kc <= budget.hi) tone = 'ok';
  else if (budget && kc < budget.lo) tone = 'warn';
  else if (budget && kc > budget.hi) tone = 'bad';

  // Trigger a one-shot green flash when the slot first enters its kcal window.
  useEffect(() => {
    const inRange = budget && kc > 0 && kc >= budget.lo && kc <= budget.hi;
    if (inRange && !wasInRange.current) {
      setFlash(true);
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
      const t = setTimeout(() => setFlash(false), 700);
      wasInRange.current = true;
      return () => clearTimeout(t);
    }
    if (!inRange) wasInRange.current = false;
  }, [kc, budget]);

  const bump = (id, qty, delta) => {
    const next = +(qty + delta).toFixed(2);
    setMealItemQty(slot, id, next);
    if (navigator.vibrate) navigator.vibrate(6);
  };

  return (
    <div className={`slot tone-${tone}${flash ? ' is-flash' : ''}`}>
      <div className="slot-hdr">
        <div className="slot-hdr-l">
          <div className="slot-t">{title}</div>
          <div className="slot-d">{items.length} ITEM{items.length === 1 ? '' : 'S'} · {p}g P</div>
        </div>
        <div className="slot-hdr-r">
          <div className={`slot-kcal tone-${tone}`}>
            {kc}
            <span className="slot-kcal-budget"> / {budget?.center || '—'}</span>
          </div>
          <div className="slot-kcal-l">KCAL</div>
        </div>
      </div>

      <div className="slot-bar-wrap">
        <div className={`slot-bar tone-${tone}`} style={{ width: `${Math.min(100, pct)}%` }} />
        {pct > 100 && <div className="slot-bar-over" style={{ width: `${Math.min(100, pct - 100)}%` }} />}
      </div>

      {items.length > 0 ? (
        <div className="slot-items">
          {items.map((it) => (
            <div key={it.id} className="slot-item">
              <div className="slot-item-l">
                <div className="slot-item-t">{it.name}</div>
                <div className="slot-item-d">
                  {it.detail} · {it.kcal} kc · {it.p}g p
                </div>
              </div>
              <div className="slot-item-qty">
                <button className="slot-qty-b" onClick={() => bump(it.id, it.qty || 1, -0.5)}>−</button>
                <div className="slot-qty-v">{it.qty || 1}×</div>
                <button className="slot-qty-b" onClick={() => bump(it.id, it.qty || 1, 0.5)}>+</button>
              </div>
              <button
                className="slot-item-x"
                onClick={() => removeMealItem(slot, it.id)}
                aria-label="Remove"
              >×</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="slot-empty">NOTHING LOGGED YET</div>
      )}

      <div className="slot-actions">
        <button className="slot-add" onClick={() => setOpen(true)}>+ ADD ITEM</button>
        {items.length > 0 && (
          <button className="slot-clear" onClick={() => {
            if (confirm('CLEAR THIS MEAL?')) clearMealSlot(slot);
          }}>CLEAR</button>
        )}
      </div>

      <MealPickerSheet slot={slot} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
