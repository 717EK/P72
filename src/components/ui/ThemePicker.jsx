import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { THEMES } from '../../data/themes';
import './ThemePicker.css';

// =====================================================================
// Mini preview tile rendered in each theme's own colors + fonts so the
// user sees what they'll get before committing. Inline styles make the
// card independent of the currently-active [data-theme="..."] so every
// card keeps its identity even as the surrounding chrome restyles.
// =====================================================================
function ThemeCard({ theme, isActive, onSelect }) {
  const { colors, fontFamily, name, tagline, sample, uppercase, gradient } = theme;
  return (
    <button
      className={`tp-card${isActive ? ' is-active' : ''}`}
      onClick={() => onSelect(theme.id)}
      style={{
        background: colors.panel,
        color: colors.fg,
        fontFamily,
        borderColor: isActive ? colors.accent : 'transparent'
      }}
    >
      <div className="tp-card-preview" style={{ background: colors.bg }}>
        <div className="tp-card-bar" style={{ background: gradient || colors.accent }} />
        <div
          className="tp-card-sample"
          style={{
            color: colors.fg,
            fontFamily,
            textTransform: uppercase ? 'uppercase' : 'none',
            letterSpacing: uppercase ? '0.15em' : '-0.01em'
          }}
        >
          {sample}
        </div>
        <div className="tp-card-dots">
          <span style={{ background: colors.accent }} />
          <span style={{ background: colors.fg }} />
          <span style={{ background: colors.dim }} />
        </div>
      </div>

      <div className="tp-card-meta">
        <div
          className="tp-card-name"
          style={{
            color: colors.fg,
            fontFamily,
            textTransform: uppercase ? 'uppercase' : 'none',
            letterSpacing: uppercase ? '0.18em' : '-0.01em'
          }}
        >
          {name}
        </div>
        <div className="tp-card-tag" style={{ color: colors.dim }}>
          {tagline}
        </div>
      </div>

      {isActive && (
        <div
          className="tp-card-check"
          style={{ background: colors.accent, color: colors.bg }}
          aria-label="Selected"
        >
          ✓
        </div>
      )}
    </button>
  );
}

// Pure grid — shared by both variants so there's one source of truth
// for card layout + selection behaviour.
function ThemeGrid({ compact }) {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  return (
    <div className={`tp-grid${compact ? ' is-compact' : ''}`}>
      {THEMES.map((t) => (
        <ThemeCard
          key={t.id}
          theme={t}
          isActive={theme === t.id}
          onSelect={setTheme}
        />
      ))}
    </div>
  );
}

// Inline variant — used inside the welcome flow so first-time users can
// pick a look without leaving the intro screen. Selection applies live.
export function ThemePickerInline() {
  return (
    <div className="tp-inline">
      <div className="tp-inline-hdr">CHOOSE YOUR LOOK</div>
      <div className="tp-inline-sub">Tap to preview · change anytime from the menu</div>
      <ThemeGrid compact />
    </div>
  );
}

// Sheet variant — opened from the hamburger menu on the main app.
// Stays open after selection so the user can sample multiple themes.
export default function ThemePickerSheet({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="tp-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          className="tp-sheet"
          onClick={(e) => e.stopPropagation()}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        >
          <div className="tp-grip" />
          <div className="tp-hdr">
            <div className="tp-hdr-t">SELECT THEME</div>
            <button className="tp-close" onClick={onClose} aria-label="Close">×</button>
          </div>
          <ThemeGrid />
          <div className="tp-foot">
            <div className="tp-foot-note">Tap any theme to apply instantly.</div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
