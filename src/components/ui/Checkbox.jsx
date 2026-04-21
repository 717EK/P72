import React from 'react';
import './Checkbox.css';

export default function Checkbox({ checked, onToggle, label, pill, meta, disabled }) {
  return (
    <div
      className={`chk${checked ? ' is-on' : ''}${disabled ? ' is-dis' : ''}`}
      onClick={disabled ? undefined : onToggle}
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(); }
      }}
    >
      <div className="chk-box" aria-hidden>
        {checked && <div className="chk-mark" />}
      </div>
      <div className="chk-txt">
        <span>{label}</span>
        {pill && <span className="chk-pill">{pill}</span>}
        {meta && <span className="chk-meta">{meta}</span>}
      </div>
    </div>
  );
}
