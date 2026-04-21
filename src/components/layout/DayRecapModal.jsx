import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/useAppStore';
import { scoreDay, kcalForDay, skinProgress, mealProgress } from '../../utils/scoring';
import { parseKey, formatDate, daysBetween } from '../../utils/dates';
import './DayRecapModal.css';

export default function DayRecapModal({ dayKey, onClose }) {
  const days = useAppStore((s) => s.days);
  const startDate = useAppStore((s) => s.startDate);
  const dat = days[dayKey] || null;

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const idx = daysBetween(parseKey(startDate), parseKey(dayKey)) + 1;

  let rows;
  if (!dat) {
    rows = null;
  } else {
    const sc = scoreDay(dat);
    const kc = kcalForDay(dat);
    const sk = skinProgress(dat);
    const mp = mealProgress(dat);
    let flagDone = 0;
    ['zeroSugar', 'zeroOil', 'proteinHit'].forEach((k) => { if (dat.flags?.[k]) flagDone++; });

    rows = [
      ['COMPLIANCE', `${sc.pct}%`, sc.pct >= 70 ? 'ok' : 'bad'],
      ['SCORE', `${sc.pts} / ${sc.max}`, ''],
      ['SKINCARE', `${sk.done} / ${sk.max}`, sk.done === sk.max ? 'ok' : ''],
      ['NIGHT RX', (dat.skin?.nightType || '—').toUpperCase(), 'info'],
      ['MEALS', `${mp.done} / ${mp.max}`, mp.done >= 8 ? 'ok' : ''],
      ['KCAL', `${kc}`, (kc >= 1400 && kc <= 1650) ? 'ok' : kc > 1700 ? 'bad' : ''],
      ['DIET FLAGS', `${flagDone} / 3`, flagDone === 3 ? 'ok' : ''],
      ['WEIGHT', dat.metrics?.weight != null ? `${dat.metrics.weight} KG` : '—', ''],
      ['STEPS', dat.metrics?.steps != null ? dat.metrics.steps.toLocaleString() : '—', (dat.metrics?.steps || 0) >= 8000 ? 'ok' : dat.metrics?.steps == null ? '' : 'bad'],
      ['SLEEP', dat.metrics?.sleep != null ? `${dat.metrics.sleep} H` : '—', (dat.metrics?.sleep || 0) >= 7 ? 'ok' : dat.metrics?.sleep == null ? '' : 'bad'],
      ['WATER', dat.metrics?.water != null ? `${dat.metrics.water} L` : '—', (dat.metrics?.water || 0) >= 3 ? 'ok' : ''],
      ['CIGARETTES', dat.metrics?.smoke != null ? String(dat.metrics.smoke) : '—', dat.metrics?.smoke === 0 ? 'ok' : (dat.metrics?.smoke || 0) > 5 ? 'bad' : ''],
      ['WORKOUT', dat.activity?.workout ? '✓ DONE' : '— MISSED', dat.activity?.workout ? 'ok' : 'bad'],
      ['CARDIO', dat.activity?.cardio ? '✓ DONE' : '—', dat.activity?.cardio ? 'ok' : ''],
      ['STRETCH', dat.activity?.stretch ? '✓ DONE' : '—', dat.activity?.stretch ? 'ok' : '']
    ];
  }

  return createPortal(
    <div className="modal" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hdr">
          <div>
            <div className="modal-t">DAY {String(idx).padStart(3, '0')}</div>
            <div className="modal-s">{formatDate(parseKey(dayKey))}</div>
          </div>
          <button className="modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {rows ? rows.map(([l, v, c]) => (
            <div key={l} className="mrow">
              <span className="mlbl">{l}</span>
              <span className={`mval tone-${c}`}>{v}</span>
            </div>
          )) : (
            <div className="mempty">// NO DATA LOGGED //</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
