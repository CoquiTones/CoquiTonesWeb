/**
 * Brand + semantic color tokens for CoquiTones.
 *
 * The palette keeps the original coquí identity (amber on near-black) but
 * raises every text/background pair to WCAG AA contrast. Components should
 * consume these tokens through the MUI theme or the CSS variables exposed by
 * `<GlobalStyles />` instead of hard-coding hex values.
 */
export const palette = {
  // Brand
  amber: '#FFC857',
  amberSoft: '#FFE1A3',
  ember: '#A44200',
  emberText: '#F2B880',

  // Surfaces
  ink: '#14120F',
  inkRaised: '#1D1A16',
  inkSoft: '#26221D',
  inkHover: '#302B24',

  // Content
  fog: '#F5F1E8',
  fogMuted: '#CFC7B8',

  // Lines & overlays
  line: 'rgba(245, 241, 232, 0.14)',
  lineStrong: 'rgba(245, 241, 232, 0.28)',
  overlay: 'rgba(12, 10, 8, 0.62)',

  // Status (all >= 4.5:1 on inkRaised)
  success: '#6FD98A',
  warning: '#FFB020',
  error: '#FF7A7A',
  info: '#7FC4FF',
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const spacing = {
  pageGutter: { xs: 2, sm: 3, md: 5 },
  sectionY: { xs: 6, md: 10 },
};

export const fontFamily = {
  body: '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
};

export const motion = {
  fast: 150,
  base: 220,
  slow: 320,
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
};
