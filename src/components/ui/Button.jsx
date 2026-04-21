import React from 'react';
import './Button.css';

export default function Button({ children, onClick, tone = 'default', fullWidth, type = 'button', disabled }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn btn-${tone}${fullWidth ? ' btn-full' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
