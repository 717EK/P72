import React, { useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { parseHealthImport } from '../../utils/health';
import { toast } from '../ui/Toast';
import Button from '../ui/Button';
import './HealthSync.css';

export default function HealthSync() {
  const importHealthRows = useAppStore((s) => s.importHealthRows);
  const healthSync = useAppStore((s) => s.healthSync);

  const fileRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteVal, setPasteVal] = useState('');
  const [busy, setBusy] = useState(false);

  const doImport = (text, source) => {
    setBusy(true);
    try {
      const res = parseHealthImport(text);
      if (res.error) {
        toast(res.error, 'bad');
        return 0;
      }
      const n = importHealthRows(res.rows, source);
      toast(n ? `SYNCED ${n} DAY${n === 1 ? '' : 'S'}` : 'NO NEW DATA', n ? 'ok' : 'warn');
      return n;
    } finally {
      setBusy(false);
    }
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const source = /\.xml$/i.test(f.name) ? 'xml' : 'auto-export';
    const reader = new FileReader();
    reader.onload = (ev) => doImport(ev.target.result, source);
    reader.onerror = () => toast('FILE READ ERROR', 'bad');
    reader.readAsText(f);
    e.target.value = '';
  };

  const onPaste = () => {
    if (!pasteVal.trim()) return;
    const n = doImport(pasteVal, 'auto-export');
    if (n) { setPasteVal(''); setPasteOpen(false); }
  };

  const lastMsg = healthSync.lastImportedAt
    ? `LAST SYNC · ${new Date(healthSync.lastImportedAt).toLocaleDateString()} · ${healthSync.lastImportedDays} DAYS`
    : 'NOT YET SYNCED';

  return (
    <div className="hs-wrap">
      <div className="subhead">Apple Health sync</div>

      <div className="hs-status">
        <div className="hs-status-dot" data-on={!!healthSync.lastImportedAt} />
        <div className="hs-status-txt">{lastMsg}</div>
        <button className="hs-howto-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'HIDE' : 'HOW'}
        </button>
      </div>

      {expanded && (
        <div className="hs-howto">
          <p className="hs-howto-p">
            Web apps can't read HealthKit directly — Apple restricts it to native apps.
            There are two ways to pull your step data in:
          </p>

          <div className="hs-opt">
            <div className="hs-opt-n">A</div>
            <div className="hs-opt-body">
              <div className="hs-opt-t">HEALTH AUTO EXPORT <span className="hs-opt-tag">RECOMMENDED</span></div>
              <div className="hs-opt-d">
                Install the <b>Health Auto Export</b> app on iPhone (App Store).
                Configure it to export Step Count as JSON, daily or on a schedule.
                Save the JSON file to Files, then upload it here.
              </div>
            </div>
          </div>

          <div className="hs-opt">
            <div className="hs-opt-n">B</div>
            <div className="hs-opt-body">
              <div className="hs-opt-t">BUILT-IN HEALTH EXPORT</div>
              <div className="hs-opt-d">
                In the Health app: tap your profile pic → Export All Health Data →
                gives a ZIP. Unzip, then upload <code>export.xml</code> here.
                Bigger file, slower parse, but works without extra apps.
              </div>
            </div>
          </div>

          <div className="hs-opt">
            <div className="hs-opt-n">C</div>
            <div className="hs-opt-body">
              <div className="hs-opt-t">MANUAL</div>
              <div className="hs-opt-d">
                Skip this entirely — type steps into the LOG tab daily. Takes 3 seconds.
              </div>
            </div>
          </div>

          <p className="hs-howto-note">
            Imported step counts only overwrite days where the imported number is higher
            than what you've already logged.
          </p>
        </div>
      )}

      <div className="hs-actions">
        <Button onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? 'WORKING…' : 'UPLOAD FILE'}
        </Button>
        <Button onClick={() => setPasteOpen((v) => !v)} disabled={busy}>
          {pasteOpen ? 'CLOSE PASTE' : 'PASTE JSON'}
        </Button>
      </div>

      {pasteOpen && (
        <div className="hs-paste">
          <textarea
            className="hs-paste-area"
            rows={6}
            placeholder='{ "data": { "metrics": [ { "name": "step_count", "data": [ ... ] } ] } }'
            value={pasteVal}
            onChange={(e) => setPasteVal(e.target.value)}
          />
          <Button tone="primary" fullWidth onClick={onPaste} disabled={busy || !pasteVal.trim()}>
            IMPORT PASTED
          </Button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json,.xml,application/xml,text/xml"
        onChange={onFile}
        style={{ display: 'none' }}
      />
    </div>
  );
}
