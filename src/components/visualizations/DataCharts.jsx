import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { metricPointsForChart } from '../../utils/scoring';
import { TOTAL_DAYS, TARGET_WEIGHT } from '../../utils/constants';
import './DataCharts.css';

const W = 400;
const H = 130;
const PAD = 16;

function LineChart({ points, color, target, title, unit, totalDays, isWeight }) {
  if (!points.length) {
    return (
      <div className="chart-wrap">
        <div className="chart-hdr">
          <span className="chart-t">{title}</span>
          <span className="chart-tag u-mute">NO DATA</span>
        </div>
        <div className="chart-box">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="chart-svg">
            <text x={W / 2} y={H / 2} textAnchor="middle" fill="var(--mute)" fontSize="10" fontFamily="var(--mono)" letterSpacing="2">— NO DATA —</text>
          </svg>
        </div>
      </div>
    );
  }

  const ys = points.map((p) => p.y);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (target != null) {
    minY = Math.min(minY, target);
    maxY = Math.max(maxY, target);
  }
  if (!isWeight) minY = 0;
  if (minY === maxY) { minY -= 1; maxY += 1; }

  const xScale = (x) => PAD + (x / Math.max(1, totalDays - 1)) * (W - PAD * 2);
  const yScale = (y) => H - PAD - ((y - minY) / (maxY - minY)) * (H - PAD * 2);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${xScale(points[points.length - 1].x).toFixed(1)},${H - PAD} L${xScale(points[0].x).toFixed(1)},${H - PAD} Z`;

  const first = points[0].y;
  const last = points[points.length - 1].y;
  const delta = last - first;
  const deltaStr = (delta >= 0 ? '+' : '') + delta.toFixed(1) + unit;
  const deltaTone = isWeight ? (delta < 0 ? 'ok' : delta > 0 ? 'bad' : 'mute') : (last === 0 ? 'ok' : 'warn');
  const avg = ys.reduce((a, b) => a + b, 0) / ys.length;

  return (
    <div className="chart-wrap">
      <div className="chart-hdr">
        <span className="chart-t">{title}</span>
        <span className={`chart-tag u-${deltaTone}`}>
          {isWeight ? `Δ ${deltaStr}` : `AVG ${avg.toFixed(1)}/D`} · {points.length} LOG{points.length !== 1 ? 'S' : ''}
        </span>
      </div>
      <div className="chart-box">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="chart-svg">
          {[0, 1, 2, 3, 4].map((i) => {
            const gy = PAD + (i * (H - PAD * 2) / 4);
            return <line key={i} x1={PAD} y1={gy} x2={W - PAD} y2={gy} stroke="var(--line)" strokeWidth="0.5" />;
          })}

          {target != null && (
            <>
              <line x1={PAD} y1={yScale(target)} x2={W - PAD} y2={yScale(target)} stroke="var(--ok)" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.55" />
              <text x={W - PAD - 2} y={yScale(target) - 4} textAnchor="end" fill="var(--ok)" fontSize="8" fontFamily="var(--mono)" opacity="0.8">TGT {target.toFixed(1)}</text>
            </>
          )}

          <line
            x1={xScale(points[points.length - 1].x)}
            y1={PAD}
            x2={xScale(points[points.length - 1].x)}
            y2={H - PAD}
            stroke="var(--info)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.4"
          />

          <path d={areaD} fill={color} opacity="0.08" />
          <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" />
          {points.map((p, i) => (
            <circle key={i} cx={xScale(p.x).toFixed(1)} cy={yScale(p.y).toFixed(1)} r="2.2" fill={color} />
          ))}

          <text x={PAD} y={H - 3} fill="var(--mute)" fontSize="8" fontFamily="var(--mono)" letterSpacing="1">MIN {minY.toFixed(1)}</text>
          <text x={W - PAD} y={H - 3} textAnchor="end" fill="var(--mute)" fontSize="8" fontFamily="var(--mono)" letterSpacing="1">MAX {maxY.toFixed(1)}</text>
        </svg>
      </div>
    </div>
  );
}

export default function DataCharts() {
  const days = useAppStore((s) => s.days);
  const startDate = useAppStore((s) => s.startDate);
  const activeDay = useAppStore((s) => s.activeDay);

  const wPoints = metricPointsForChart(days, startDate, activeDay, 'weight');
  const sPoints = metricPointsForChart(days, startDate, activeDay, 'smoke');

  return (
    <div className="charts">
      <LineChart
        points={wPoints}
        color="#39ff14"
        target={TARGET_WEIGHT}
        title="WEIGHT_TRAJECTORY"
        unit=" KG"
        totalDays={TOTAL_DAYS}
        isWeight
      />
      <LineChart
        points={sPoints}
        color="#ff003c"
        target={0}
        title="SMOKING_TAPER"
        unit="/D"
        totalDays={TOTAL_DAYS}
        isWeight={false}
      />
    </div>
  );
}
