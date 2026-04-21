import React from 'react';
import NumericInput from '../ui/NumericInput';
import { useAppStore } from '../../store/useAppStore';
import { METRIC_TARGETS } from '../../utils/constants';

export default function BodyMetrics() {
  const day = useAppStore((s) => s.getCurrentDay());
  const setMetric = useAppStore((s) => s.setMetric);

  return (
    <div>
      <div className="subhead">Body metrics</div>
      <NumericInput
        label="Weight"
        target="TGT 72.0 KG · 0.5–0.8 KG / WK"
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
        label="Cigarettes"
        target="GOAL: TAPER → 0"
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
