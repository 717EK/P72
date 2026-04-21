import React from 'react';
import './NumericInput.css';

export default function NumericInput({
  label, target, value, onChange, unit, step = 1, min = 0, max = 9999,
  placeholder = '—', okWhen
}) {
  const v = value ?? '';
  let tone = '';
  if (value != null && value !== '') tone = okWhen(Number(value)) ? 'ok' : 'bad';

  return (
    <label className="nrow">
      <div className="nrow-lbl">
        <span className="nrow-t">{label}</span>
        {target && <span className="nrow-tgt">{target}</span>}
      </div>
      <div className={`nrow-input tone-${tone}`}>
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={v}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === '' ? null : parseFloat(raw));
          }}
        />
        {unit && <span className="nrow-unit">{unit}</span>}
      </div>
    </label>
  );
}
