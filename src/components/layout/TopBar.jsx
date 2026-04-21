import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatClock, formatDate, parseKey } from '../../utils/dates';
import { toast } from '../ui/Toast';
import './TopBar.css';

export default function TopBar() {
  const dayNum = useAppStore((s) => s.currentDayNumber());
  const activeDay = useAppStore((s) => s.activeDay);
  const name = useAppStore((s) => s.profile?.name);
  const exportData = useAppStore((s) => s.exportData);
  const importData = useAppStore((s) => s.importData);
  const resetAll = useAppStore((s) => s.resetAll);

  const [clock, setClock] = useState(formatClock(new Date()));
  const [menu, setMenu] = useState(false);
  const fileRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menu]);

  const onExport = () => {
    const payload = exportData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date();
    a.href = url;
    a.download = `protocol72_${today.toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('EXPORTED', 'ok');
    setMenu(false);
  };

  const onImport = () => { fileRef.current?.click(); setMenu(false); };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!confirm('IMPORT WILL OVERWRITE ALL CURRENT DATA. CONTINUE?')) return;
        const ok = importData(data);
        toast(ok ? 'IMPORT SUCCESS' : 'INVALID FILE', ok ? 'ok' : 'bad');
      } catch {
        toast('PARSE ERROR', 'bad');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  const onRestart = () => {
    if (!confirm('RESTART SETUP? PROFILE AND START DATE WILL BE CLEARED. LOGGED DAYS ARE KEPT.')) return;
    // Soft reset — clear onboarding + start date only, keep day logs.
    // We use importData with a shaped payload to achieve this cleanly.
    const current = exportData();
    importData({
      start: null,
      days: current.days,
      profile: null,
      onboarded: false
    });
    toast('SETUP RESET', 'warn');
    setMenu(false);
  };

  const onReset = () => {
    if (!confirm('WIPE ALL DATA? 120-DAY HISTORY WILL BE ERASED.')) return;
    if (!confirm('CONFIRM AGAIN. THIS CANNOT BE UNDONE.')) return;
    resetAll();
    toast('STATE WIPED', 'bad');
    setMenu(false);
  };

  const dayLabel = dayNum > 0 ? `D${String(dayNum).padStart(3, '0')}` : 'D000';
  const firstName = (name || '').trim().split(/\s+/)[0].toUpperCase();

  return (
    <header className="top">
      <div className="top-l">
        <div className="top-brand">
          PROTOCOL_<span className="u-ok">72</span>
        </div>
        <div className="top-sub">
          {firstName ? <>HEY, <span className="u-ok">{firstName}</span> · 120-DAY</> : '120-DAY · STRICT REGIMEN'}
        </div>
      </div>

      <div className="top-r">
        <div className="top-day">{dayLabel}</div>
        <div className="top-meta">
          <div className="top-date">{formatDate(parseKey(activeDay))}</div>
          <div className="top-clock u-tabular">{clock}</div>
        </div>
        <div className="top-menu-wrap" ref={menuRef}>
          <button className="top-menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu">
            <span /><span /><span />
          </button>
          {menu && (
            <div className="top-menu">
              <button onClick={onExport}>EXPORT JSON</button>
              <button onClick={onImport}>IMPORT JSON</button>
              <button onClick={onRestart}>RESTART SETUP</button>
              <button className="danger" onClick={onReset}>WIPE ALL</button>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          style={{ display: 'none' }}
        />
      </div>
    </header>
  );
}
