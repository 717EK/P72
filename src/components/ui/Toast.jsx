import React, { useEffect, useState } from 'react';
import './Toast.css';

let idCounter = 0;

export function toast(msg, tone = 'ok', ms = 1800) {
  window.dispatchEvent(new CustomEvent('p72-toast', { detail: { id: ++idCounter, msg, tone, ms } }));
}

export default function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const t = e.detail;
      setItems((prev) => [...prev, t]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, t.ms);
    };
    window.addEventListener('p72-toast', handler);
    return () => window.removeEventListener('p72-toast', handler);
  }, []);

  return (
    <div className="toast-host" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
