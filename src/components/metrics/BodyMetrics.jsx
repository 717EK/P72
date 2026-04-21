import React from 'react';
import NumericInput from '../ui/NumericInput';
import { useAppStore } from '../../store/useAppStore';
import { METRIC_TARGETS } from '../../utils/constants';
import { proteinTargetG } from '../../utils/health';

export default function BodyMetrics() {
  const day = useAppStore((s) => s.getCurrentDay());
  const setMetric = useAppStore((s) => s.setMetric);
  const profile = useAppStore((s) => s.profile);

  // Target uses the user's starting weight; falls back to the app's default.
  const proteinG = proteinTargetG({ weightKg: profile?.startWeightKg });
  const goal = profile?.goalWeightKg || METRIC_TARGETS.weight;

  return (
    <div>
      <div className="subhead">Body metrics</div>
      <NumericInput
        label="Weight"
        target={`TGT ${goal.toFixed(1)} KG · 0.5–0.8 KG / WK`}
        unit="KG"
        step={0.1}
        min={40}
        max={200}
        value={day.metrics.weight}
        okWhen={(v) => v > 0}
        onChange={(v) => setMetric('weight', v)}
      />
      <NumericInput
        label="Steps"
        target={`TGT ${METRIC_TARGETS.steps.toLocaleString()}–10,000`}
        unit="STEPS"
        step={100}
        min={0}
        max={60000}
        value={day.metrics.steps}
        okWhen={(v) => v >= METRIC_TARGETS.steps}
        onChange={(v) => setMetric('steps', v)}
      />
      <NumericInput
        label="Sleep hrs"
        target="TGT 7+ HRS"
        unit="H"
        step={0.25}
        min={0}
        max={14}
        value={day.metrics.sleep}
        okWhen={(v) => v >= METRIC_TARGETS.sleep}
        onChange={(v) => setMetric('sleep', v)}
      />
      <NumericInput
        label="Water"
        target="TGT 3.0 L"
        unit="L"
        step={0.25}
        min={0}
        max={10}
        value={day.metrics.water}
        okWhen={(v) => v >= METRIC_TARGETS.water}
        onChange={(v) => setMetric('water', v)}
      />
      <NumericInput
        label="Protein"
        target={`TGT ${proteinG} G · 1.8 G/KG`}
        unit="G"
        step={5}
        min={0}
        max={400}
        value={day.metrics.proteinG}
        okWhen={(v) => v >= proteinG}
        onChange={(v) => setMetric('proteinG', v)}
      />
      <NumericInput
        label="Cigarettes"
        target={profile?.smokeBaseline ? `BASELINE ${profile.smokeBaseline} → 0` : 'GOAL: TAPER → 0'}
        unit="CIGS"
        step={1}
        min={0}
        max={60}
        value={day.metrics.smoke}
        okWhen={(v) => v === 0}
        onChange={(v) => setMetric('smoke', v)}
      />
    </div>
  );
}
