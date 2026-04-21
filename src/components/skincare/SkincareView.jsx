import React from 'react';
import AmRoutine from './AmRoutine';
import PmRoutine from './PmRoutine';
import { useAppStore } from '../../store/useAppStore';
import { skinProgress } from '../../utils/scoring';

export default function SkincareView() {
  const day = useAppStore((s) => s.getCurrentDay());
  const { done, max } = skinProgress(day);
  const full = done === max;

  return (
    <section>
      <div className="section-title">
        <span>SKINCARE_PROTOCOL</span>
        <span className={`tag${full ? ' ok' : done === 0 ? '' : ' warn'}`}>
          {done} / {max} DONE
        </span>
      </div>
      <AmRoutine />
      <PmRoutine />
    </section>
  );
}
