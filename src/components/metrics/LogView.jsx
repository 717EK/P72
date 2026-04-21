import React from 'react';
import BodyMetrics from './BodyMetrics';
import ActivityToggles from './ActivityToggles';

export default function LogView() {
  return (
    <section>
      <div className="section-title">
        <span>LOG // METRICS_INPUT</span>
        <span className="tag">AUTO-SAVE</span>
      </div>
      <BodyMetrics />
      <ActivityToggles />
    </section>
  );
}
