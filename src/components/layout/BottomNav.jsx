import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TABS } from '../../utils/constants';
import { slotFilled } from '../../utils/scoring';
import './BottomNav.css';

// Compute which tabs warrant an attention dot *right now*.
// Rules (deliberately subtle — only shown when there's a clear incomplete state):
//   SKIN : AM routine < 4/4 and it's past 10am, OR PM routine < 3/3 and past 8pm
//   FUEL : any primary slot (M/L/D) empty and it's past its typical window
//   LOG  : weight OR sleep not yet logged by 10pm
function useAttention(day) {
  const now = new Date();
  const h = now.getHours();

  // SKIN: any routine incomplete after its expected time
  const am = day.skin?.am || {};
  const amDone = am.wash && am.vitc && am.moist && am.spf;
  const pm = day.skin?.pm || {};
  const pmDone = pm.cleanse && pm.active && pm.moist;
  const skinAttn = (!amDone && h >= 10) || (!pmDone && h >= 20);

  // FUEL: unfilled primary slot after its window
  const fuelAttn =
    (h >= 10 && !slotFilled(day, 'M')) ||
    (h >= 15 && !slotFilled(day, 'L')) ||
    (h >= 22 && !slotFilled(day, 'D'));

  // LOG: weight or sleep missing by bedtime
  const logAttn = h >= 22 && (
    day.metrics?.weight == null || day.metrics?.sleep == null
  );

  return { dash: false, skin: skinAttn, fuel: fuelAttn, log: logAttn };
}

export default function BottomNav() {
  const active = useAppStore((s) => s.activeTab);
  const setTab = useAppStore((s) => s.setActiveTab);
  const day = useAppStore((s) => s.getCurrentDay());
  const attn = useAttention(day);

  return (
    <nav className="bnav" role="tablist">
      {TABS.map((t) => {
        const hasAttn = attn[t.id];
        return (
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
            {hasAttn && <span className="bnav-dot" aria-label="Incomplete" />}
          </button>
        );
      })}
    </nav>
  );
}
