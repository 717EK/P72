import React from 'react';
import Checkbox from '../ui/Checkbox';
import { DIET_FLAGS } from '../../utils/constants';
import { useAppStore } from '../../store/useAppStore';

export default function DietFlags() {
  const day = useAppStore((s) => s.getCurrentDay());
  const toggle = useAppStore((s) => s.toggleFlag);

  return (
    <div>
      <div className="subhead">Diet flags</div>
      {DIET_FLAGS.map((f) => (
        <Checkbox
          key={f.k}
          label={f.t}
          checked={!!day.flags[f.k]}
          onToggle={() => toggle(f.k)}
        />
      ))}
    </div>
  );
}
