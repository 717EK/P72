import React from 'react';
import BodyMetrics from './BodyMetrics';
import ActivityToggles from './ActivityToggles';
import HealthSync from './HealthSync';

export default function LogView() {
  return (
    <section>
      <div className="section-title">
        <span>LOG // METRICS_INPUT</span>
        <span className="tag">AUTO-SAVE</span>
      </div>
      <HealthSync />
      <BodyMetrics />
      <ActivityToggles />
    </section>
  );
}
