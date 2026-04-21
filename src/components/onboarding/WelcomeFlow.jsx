import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import Button from '../ui/Button';
import { todayKey, parseKey, addDays, dateKey, formatDate } from '../../utils/dates';
import {
  ACTIVITY_FACTORS, SEX_OPTIONS, bmr, tdee, bmi, bmiTier, ageFrom,
  calorieWindow, proteinTargetG, ftInToCm, lbsToKg
} from '../../utils/health';
import './WelcomeFlow.css';

const STEPS = [
  { id: 'intro',    label: 'INTRO' },
  { id: 'identity', label: 'IDENTITY' },
  { id: 'body',     label: 'BODY' },
  { id: 'habit',    label: 'BASELINE' },
  { id: 'activity', label: 'ACTIVITY' },
  { id: 'review',   label: 'REVIEW' },
  { id: 'start',    label: 'START' }
];

export default function WelcomeFlow() {
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const startProtocol = useAppStore((s) => s.startProtocol);

  const [stepIdx, setStepIdx] = useState(0);
  const [units, setUnits] = useState(profile.units || 'metric');
  // Imperial-only scratch (stored as metric in profile)
  const [ft, setFt] = useState('');
  const [inches, setInches] = useState('');
  const [lbs, setLbs] = useState('');
  const [goalLbs, setGoalLbs] = useState('');

  const step = STEPS[stepIdx];
  const canNext = validate(step.id, profile, { ft, inches, lbs });

  const next = () => {
    // Before leaving body step in imperial, convert into profile.
    if (step.id === 'body' && units === 'imperial') {
      if (ft || inches) setProfile({ heightCm: ftInToCm(ft, inches) });
      if (lbs) setProfile({ startWeightKg: lbsToKg(lbs) });
      if (goalLbs) setProfile({ goalWeightKg: lbsToKg(goalLbs) });
    }
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  };
  const back = () => { if (stepIdx > 0) setStepIdx(stepIdx - 1); };

  return (
    <div className="wf-shell">
      <div className="wf-header">
        <div className="wf-brand">PROTOCOL_<span className="u-ok">72</span></div>
        <div className="wf-sub">120-DAY · STRICT REGIMEN · SETUP</div>
      </div>

      <div className="wf-progress">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`wf-prog-cell ${i <= stepIdx ? 'on' : ''} ${i === stepIdx ? 'cur' : ''}`}
            title={s.label}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          className="wf-body"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {step.id === 'intro' && <IntroStep />}
          {step.id === 'identity' && (
            <IdentityStep profile={profile} setProfile={setProfile} />
          )}
          {step.id === 'body' && (
            <BodyStep
              profile={profile}
              setProfile={setProfile}
              units={units}
              setUnits={setUnits}
              ft={ft} setFt={setFt}
              inches={inches} setInches={setInches}
              lbs={lbs} setLbs={setLbs}
              goalLbs={goalLbs} setGoalLbs={setGoalLbs}
            />
          )}
          {step.id === 'habit' && (
            <HabitStep profile={profile} setProfile={setProfile} />
          )}
          {step.id === 'activity' && (
            <ActivityStep profile={profile} setProfile={setProfile} />
          )}
          {step.id === 'review' && <ReviewStep profile={profile} />}
          {step.id === 'start' && <StartStep onStart={startProtocol} />}
        </motion.div>
      </AnimatePresence>

      {step.id !== 'start' && (
        <div className="wf-nav">
          <Button onClick={back} disabled={stepIdx === 0}>BACK</Button>
          <div className="wf-nav-count">{stepIdx + 1} / {STEPS.length}</div>
          <Button onClick={next} tone="primary" disabled={!canNext}>
            {stepIdx === STEPS.length - 2 ? 'CONTINUE' : 'NEXT'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------- step-level validation ----------
function validate(id, p, scratch) {
  if (id === 'intro') return true;
  if (id === 'identity') {
    if (!p.name?.trim()) return false;
    if (!p.sex) return false;
    if (!p.dob) return false;
    const age = ageFrom(p.dob);
    if (age == null || age < 13 || age > 100) return false;
    return true;
  }
  if (id === 'body') {
    const hasHeight = p.heightCm > 0 || (scratch.ft || scratch.inches);
    const hasWeight = p.startWeightKg > 0 || scratch.lbs;
    return hasHeight && hasWeight;
  }
  if (id === 'habit') return true; // all optional
  if (id === 'activity') return !!p.activity;
  return true;
}

// ---------- individual steps ----------
function IntroStep() {
  return (
    <>
      <h1 className="wf-h1">WELCOME.</h1>
      <p className="wf-lede">
        120 days. Skin, diet, body, activity.
        One log per day. No backend, no account — everything lives on this device.
      </p>
      <div className="wf-blocks">
        <div className="wf-block">
          <div className="wf-block-n">01</div>
          <div className="wf-block-t">QUICK PROFILE</div>
          <div className="wf-block-d">Name, age, height, starting weight — powers calorie + protein targets.</div>
        </div>
        <div className="wf-block">
          <div className="wf-block-n">02</div>
          <div className="wf-block-t">APPLE HEALTH</div>
          <div className="wf-block-d">Optional. Import step counts from the Health app — setup lives inside the LOG tab.</div>
        </div>
        <div className="wf-block">
          <div className="wf-block-n">03</div>
          <div className="wf-block-t">START</div>
          <div className="wf-block-d">Pick today or tomorrow as Day 1. The day rolls over at local midnight.</div>
        </div>
      </div>
    </>
  );
}

function IdentityStep({ profile, setProfile }) {
  const age = ageFrom(profile.dob);
  return (
    <>
      <h2 className="wf-h2">WHO</h2>
      <div className="wf-field">
        <label className="wf-lbl">NAME</label>
        <input
          className="wf-input"
          value={profile.name || ''}
          placeholder="—"
          maxLength={32}
          onChange={(e) => setProfile({ name: e.target.value })}
        />
      </div>

      <div className="wf-field">
        <label className="wf-lbl">SEX <span className="wf-lbl-note">for BMR math</span></label>
        <div className="wf-pill-row">
          {SEX_OPTIONS.map((o) => (
            <button
              key={o.k}
              className={`wf-pill ${profile.sex === o.k ? 'on' : ''}`}
              onClick={() => setProfile({ sex: o.k })}
              type="button"
            >{o.label}</button>
          ))}
        </div>
      </div>

      <div className="wf-field">
        <label className="wf-lbl">DATE OF BIRTH {age != null && <span className="wf-lbl-note">AGE {age}</span>}</label>
        <input
          className="wf-input"
          type="date"
          value={profile.dob || ''}
          max={todayKey()}
          onChange={(e) => setProfile({ dob: e.target.value || null })}
        />
      </div>
    </>
  );
}

function BodyStep({ profile, setProfile, units, setUnits, ft, setFt, inches, setInches, lbs, setLbs, goalLbs, setGoalLbs }) {
  const b = bmi(profile);
  const tier = bmiTier(b);
  return (
    <>
      <h2 className="wf-h2">BODY</h2>

      <div className="wf-field">
        <label className="wf-lbl">UNITS</label>
        <div className="wf-pill-row">
          <button
            className={`wf-pill ${units === 'metric' ? 'on' : ''}`}
            onClick={() => { setUnits('metric'); setProfile({ units: 'metric' }); }}
            type="button"
          >METRIC · KG / CM</button>
          <button
            className={`wf-pill ${units === 'imperial' ? 'on' : ''}`}
            onClick={() => { setUnits('imperial'); setProfile({ units: 'imperial' }); }}
            type="button"
          >IMPERIAL · LB / FT</button>
        </div>
      </div>

      {units === 'metric' ? (
        <>
          <div className="wf-field">
            <label className="wf-lbl">HEIGHT</label>
            <div className="wf-input-wrap">
              <input
                className="wf-input"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="120" max="230"
                value={profile.heightCm ?? ''}
                onChange={(e) => setProfile({ heightCm: e.target.value === '' ? null : +e.target.value })}
              />
              <span className="wf-unit">CM</span>
            </div>
          </div>
          <div className="wf-field">
            <label className="wf-lbl">STARTING WEIGHT</label>
            <div className="wf-input-wrap">
              <input
                className="wf-input"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="35" max="250"
                value={profile.startWeightKg ?? ''}
                onChange={(e) => setProfile({ startWeightKg: e.target.value === '' ? null : +e.target.value })}
              />
              <span className="wf-unit">KG</span>
            </div>
          </div>
          <div className="wf-field">
            <label className="wf-lbl">GOAL WEIGHT <span className="wf-lbl-note">DEFAULT 72</span></label>
            <div className="wf-input-wrap">
              <input
                className="wf-input"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="40" max="150"
                value={profile.goalWeightKg ?? ''}
                onChange={(e) => setProfile({ goalWeightKg: e.target.value === '' ? null : +e.target.value })}
              />
              <span className="wf-unit">KG</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="wf-field">
            <label className="wf-lbl">HEIGHT</label>
            <div className="wf-grid-2">
              <div className="wf-input-wrap">
                <input className="wf-input" type="number" min="3" max="8" value={ft} placeholder="ft"
                  onChange={(e) => setFt(e.target.value)} />
                <span className="wf-unit">FT</span>
              </div>
              <div className="wf-input-wrap">
                <input className="wf-input" type="number" min="0" max="11" value={inches} placeholder="in"
                  onChange={(e) => setInches(e.target.value)} />
                <span className="wf-unit">IN</span>
              </div>
            </div>
          </div>
          <div className="wf-field">
            <label className="wf-lbl">STARTING WEIGHT</label>
            <div className="wf-input-wrap">
              <input className="wf-input" type="number" min="80" max="550" value={lbs}
                onChange={(e) => setLbs(e.target.value)} />
              <span className="wf-unit">LB</span>
            </div>
          </div>
          <div className="wf-field">
            <label className="wf-lbl">GOAL WEIGHT <span className="wf-lbl-note">~158 LB = 72 KG</span></label>
            <div className="wf-input-wrap">
              <input className="wf-input" type="number" min="80" max="400" value={goalLbs}
                onChange={(e) => setGoalLbs(e.target.value)} />
              <span className="wf-unit">LB</span>
            </div>
          </div>
        </>
      )}

      {b != null && (
        <div className="wf-meta-row">
          <div className="wf-meta-cell">
            <div className="wf-meta-l">BMI</div>
            <div className={`wf-meta-v u-${tier.tone}`}>{b.toFixed(1)}</div>
          </div>
          <div className="wf-meta-cell">
            <div className="wf-meta-l">TIER</div>
            <div className={`wf-meta-v u-${tier.tone}`}>{tier.label}</div>
          </div>
        </div>
      )}
    </>
  );
}

function HabitStep({ profile, setProfile }) {
  return (
    <>
      <h2 className="wf-h2">BASELINE</h2>
      <p className="wf-lede-sm">
        Current cigarettes/day. Used to chart your taper against day 1 — optional,
        enter 0 or leave blank if it doesn't apply.
      </p>
      <div className="wf-field">
        <label className="wf-lbl">CIGARETTES / DAY <span className="wf-lbl-note">BASELINE</span></label>
        <div className="wf-input-wrap">
          <input
            className="wf-input"
            type="number"
            min="0" max="80"
            value={profile.smokeBaseline ?? ''}
            placeholder="0"
            onChange={(e) => setProfile({ smokeBaseline: e.target.value === '' ? null : +e.target.value })}
          />
          <span className="wf-unit">CIGS</span>
        </div>
      </div>
    </>
  );
}

function ActivityStep({ profile, setProfile }) {
  return (
    <>
      <h2 className="wf-h2">ACTIVITY</h2>
      <p className="wf-lede-sm">Baseline activity level — drives your calorie target.</p>
      <div className="wf-stack">
        {Object.entries(ACTIVITY_FACTORS).map(([k, v]) => (
          <button
            key={k}
            className={`wf-row-pick ${profile.activity === k ? 'on' : ''}`}
            onClick={() => setProfile({ activity: k })}
            type="button"
          >
            <div className="wf-row-l">
              <div className="wf-row-t">{v.label}</div>
              <div className="wf-row-d">{v.note}</div>
            </div>
            <div className="wf-row-r">×{v.f}</div>
          </button>
        ))}
      </div>
    </>
  );
}

function ReviewStep({ profile }) {
  const age = ageFrom(profile.dob);
  const b = bmr({
    sex: profile.sex, weightKg: profile.startWeightKg,
    heightCm: profile.heightCm, ageYears: age
  });
  const t = tdee({ ...profile, weightKg: profile.startWeightKg, ageYears: age });
  const win = calorieWindow({ ...profile, weightKg: profile.startWeightKg, ageYears: age });
  const protein = proteinTargetG({ weightKg: profile.startWeightKg });

  const bmiVal = bmi(profile);
  const bmiT = bmiTier(bmiVal);

  return (
    <>
      <h2 className="wf-h2">TARGETS</h2>
      <p className="wf-lede-sm">Computed from your inputs. You can edit body metrics any time in the LOG tab.</p>

      <div className="wf-review">
        <Row l="NAME"    v={profile.name || '—'} />
        <Row l="SEX"     v={profile.sex?.toUpperCase() || '—'} />
        <Row l="AGE"     v={age != null ? `${age}` : '—'} />
        <Row l="HEIGHT"  v={profile.heightCm ? `${profile.heightCm} CM` : '—'} />
        <Row l="WEIGHT"  v={profile.startWeightKg ? `${profile.startWeightKg} KG` : '—'} />
        <Row l="GOAL"    v={profile.goalWeightKg ? `${profile.goalWeightKg} KG` : '—'}
             delta={(profile.startWeightKg && profile.goalWeightKg)
               ? `Δ ${(profile.goalWeightKg - profile.startWeightKg).toFixed(1)} KG` : null} />
        <Row l="BMI"     v={bmiVal != null ? bmiVal.toFixed(1) : '—'} tone={bmiT.tone} sub={bmiT.label} />
      </div>

      <div className="wf-subtitle">DERIVED</div>
      <div className="wf-review">
        <Row l="BMR"          v={b ? `${b} KCAL` : '—'} sub="baseline burn" />
        <Row l="TDEE"         v={t ? `${t} KCAL` : '—'} sub="with activity" />
        <Row l="KCAL WINDOW"  v={`${win.lo}–${win.hi}`} sub="~500 kcal deficit" tone="ok" />
        <Row l="PROTEIN TGT"  v={`${protein} G / DAY`} sub="1.8 g/kg bodyweight" tone="ok" />
      </div>
    </>
  );
}

function Row({ l, v, sub, delta, tone }) {
  return (
    <div className="wf-row">
      <div className="wf-row-lbl">{l}</div>
      <div className="wf-row-val-wrap">
        <div className={`wf-row-val ${tone ? 'u-' + tone : ''}`}>{v}</div>
        {sub && <div className="wf-row-sub">{sub}</div>}
        {delta && <div className="wf-row-sub">{delta}</div>}
      </div>
    </div>
  );
}

function StartStep({ onStart }) {
  const today = todayKey();
  const tomorrow = dateKey(addDays(parseKey(today), 1));
  const [when, setWhen] = useState(tomorrow);

  const go = () => onStart(when);

  return (
    <>
      <h2 className="wf-h2">START</h2>
      <p className="wf-lede-sm">
        This sets Day 001. The 120-day clock begins on the selected date.
        Day rolls over at local midnight.
      </p>

      <div className="wf-stack">
        <button
          className={`wf-row-pick ${when === today ? 'on' : ''}`}
          onClick={() => setWhen(today)}
          type="button"
        >
          <div className="wf-row-l">
            <div className="wf-row-t">TODAY</div>
            <div className="wf-row-d">{formatDate(parseKey(today))}</div>
          </div>
          <div className="wf-row-r">D001 NOW</div>
        </button>

        <button
          className={`wf-row-pick ${when === tomorrow ? 'on' : ''}`}
          onClick={() => setWhen(tomorrow)}
          type="button"
        >
          <div className="wf-row-l">
            <div className="wf-row-t">TOMORROW <span className="u-ok">·RECOMMENDED</span></div>
            <div className="wf-row-d">{formatDate(parseKey(tomorrow))}</div>
          </div>
          <div className="wf-row-r">D001 AT 00:00</div>
        </button>
      </div>

      <div className="wf-start-cta">
        <Button fullWidth tone="primary" onClick={go}>
          ▶ START PROTOCOL — {when === today ? 'TODAY' : 'TOMORROW 00:00'}
        </Button>
      </div>
      <p className="wf-fine">
        You can re-edit your profile later via the menu. All data stays on this device.
      </p>
    </>
  );
}
