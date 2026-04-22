// =====================================================================
// Theme metadata for the ThemePicker UI.
//
// Each entry here mirrors a [data-theme="..."] rule in src/styles/themes.css.
// The `colors` swatches + `fontFamily` are used to render a mini preview
// tile for each theme that's independent of the currently-active theme —
// so the user sees what they'll get BEFORE switching.
// =====================================================================

export const THEMES = [
  {
    id: 'terminal',
    name: 'TERMINAL',
    tagline: 'Brutalist · monospace · neon',
    colors: { bg: '#0a0a0a', panel: '#111111', fg: '#f0f0f0', dim: '#9a9a9a', accent: '#39ff14' },
    fontName: 'JetBrains Mono',
    fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace",
    sample: 'PROTOCOL',
    uppercase: true
  },
  {
    id: 'aurora',
    name: 'Aurora',
    tagline: 'Liquid glass · gradient · soft',
    colors: { bg: '#070614', panel: '#1a1530', fg: '#ece9f7', dim: '#a6a0c4', accent: '#a78bfa' },
    fontName: 'Inter',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    sample: 'Protocol',
    uppercase: false,
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)'
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    tagline: 'Editorial · serif · warm cream',
    colors: { bg: '#f7f3ea', panel: '#fffcf4', fg: '#1c1a17', dim: '#5a554a', accent: '#a91d2a' },
    fontName: 'Instrument Serif',
    fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
    sample: 'Protocol',
    uppercase: false
  },
  {
    id: 'vapor',
    name: 'VAPOR',
    tagline: 'Synthwave · cyberpunk · neon',
    colors: { bg: '#0a041a', panel: '#15082e', fg: '#fde8ff', dim: '#c7a8e8', accent: '#ff00e0' },
    fontName: 'Orbitron',
    fontFamily: "'Orbitron', 'Share Tech Mono', sans-serif",
    sample: 'PROTOCOL',
    uppercase: true,
    gradient: 'linear-gradient(135deg, #ff00e0 0%, #00e5ff 100%)'
  },
  {
    id: 'forest',
    name: 'Forest',
    tagline: 'Organic · wellness · sage',
    colors: { bg: '#f4efe4', panel: '#fbf7ec', fg: '#1f2a1d', dim: '#4a5648', accent: '#5c7a3b' },
    fontName: 'Fraunces',
    fontFamily: "'Fraunces', Georgia, serif",
    sample: 'Protocol',
    uppercase: false
  },
  {
    id: 'clay',
    name: 'Clay',
    tagline: 'Neomorphic · soft · rounded',
    colors: { bg: '#e6e4ee', panel: '#ecebf2', fg: '#2a2740', dim: '#5a557a', accent: '#8a7ad6' },
    fontName: 'DM Sans',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    sample: 'Protocol',
    uppercase: false
  }
];

export const THEME_BY_ID = THEMES.reduce((o, t) => ((o[t.id] = t), o), {});
