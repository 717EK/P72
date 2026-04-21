import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TABS } from '../../utils/constants';
import './BottomNav.css';

export default function BottomNav() {
  const active = useAppStore((s) => s.activeTab);
  const setTab = useAppStore((s) => s.setActiveTab);

  return (
    <nav className="bnav" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`bnav-tab${active === t.id ? ' is-active' : ''}`}
          onClick={() => setTab(t.id)}
        >
          <span className="bnav-brk">[</span>
          <span className="bnav-lbl">{t.label}</span>
          <span className="bnav-brk">]</span>
        </button>
      ))}
    </nav>
  );
}
