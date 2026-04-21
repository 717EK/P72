import React from 'react';
import Checkbox from '../ui/Checkbox';
import { AM_ROUTINE } from '../../utils/constants';
import { useAppStore } from '../../store/useAppStore';

export default function AmRoutine() {
  const day = useAppStore((s) => s.getCurrentDay());
  const toggleSkinAm = useAppStore((s) => s.toggleSkinAm);

  return (
    <div>
      <div className="subhead">AM // Morning routine</div>
      {AM_ROUTINE.map((item, idx) => (
        <Checkbox
          key={item.k}
          label={item.t}
          checked={!!day.skin.am[item.k]}
          meta={`STEP ${idx + 1}`}
          onToggle={() => toggleSkinAm(item.k)}
        />
      ))}
    </div>
  );
}
