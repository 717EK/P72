import React from 'react';
import Checkbox from '../ui/Checkbox';
import { ACTIVITY_TOGGLES } from '../../utils/constants';
import { useAppStore } from '../../store/useAppStore';

export default function ActivityToggles() {
  const day = useAppStore((s) => s.getCurrentDay());
  const toggle = useAppStore((s) => s.toggleActivity);

  return (
    <div>
      <div className="subhead">Activity</div>
      {ACTIVITY_TOGGLES.map((a) => (
        <Checkbox
          key={a.k}
          label={a.t}
          meta={a.note}
          checked={!!day.activity[a.k]}
          onToggle={() => toggle(a.k)}
        />
      ))}
    </div>
  );
}
