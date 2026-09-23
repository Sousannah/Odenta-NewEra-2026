/**
 * The Odenta palette as plain values.
 *
 * Tailwind covers everything that renders through a class name. This file is
 * for everything that cannot: SVG `fill`/`stroke`, Recharts colour props,
 * canvas, and inline gradients. The two must stay in step — the scales here
 * are the same numbers as `tailwind.config.js`.
 */

export const brand = {
  50: "#EAF6FC",
  100: "#D2EAF8",
  200: "#A6D6F1",
  300: "#6FBCE7",
  400: "#329FD9",
  500: "#0E88C6",
  600: "#0077B6",
  700: "#00639A",
  800: "#004F7C",
  900: "#003D62",
};

export const accent = {
  50: "#E8FAF8",
  100: "#CDF3F0",
  200: "#9CE8E2",
  300: "#63D9D1",
  400: "#37C6BD",
  500: "#20B2AA",
  600: "#159A93",
  700: "#107C76",
  800: "#0D625E",
  900: "#0A4E4B",
};

export const ink = {
  DEFAULT: "#0F2E3D",
  muted: "#4A6B7C",
  soft: "#7E97A5",
  faint: "#B4C6CF",
};

export const semantic = {
  success: "#2BB673",
  successSoft: "#E7F7EF",
  successStrong: "#178B55",
  warning: "#F5A623",
  warningSoft: "#FEF4E2",
  warningInk: "#8C6103",
  danger: "#E4576B",
  dangerSoft: "#FDECEF",
  dangerInk: "#9E2438",
  info: "#3EA0F1",
  infoSoft: "#E7F2FE",
  infoInk: "#0B5F9E",
};

export const surface = {
  canvas: "#F3F8FB",
  card: "#FFFFFF",
  line: "#E2ECF2",
  lineSoft: "#EFF5F9",
};

/** The Odenta signature: ocean blue into teal. */
export const gradient = {
  primary: "linear-gradient(135deg, #0077B6 0%, #20B2AA 100%)",
  deep: "linear-gradient(135deg, #00639A 0%, #0077B6 45%, #20B2AA 100%)",
  soft: "linear-gradient(135deg, #EAF6FC 0%, #E8FAF8 100%)",
  from: brand[600],
  to: accent[500],
};

/**
 * Categorical series colours, in the order charts should consume them.
 * Ordered for contrast between neighbours, not by hue.
 */
export const chartSeries = [
  brand[600],
  accent[500],
  "#7C6BF5",
  semantic.warning,
  semantic.danger,
  brand[300],
  accent[700],
  ink.soft,
];

export const chart = {
  primary: brand[600],
  secondary: accent[500],
  grid: "#E2ECF2",
  axis: ink.soft,
  tooltipBg: ink.DEFAULT,
  positive: semantic.success,
  negative: semantic.danger,
  neutral: ink.faint,
};

/** Odontogram tooth states — fill / outline / label per condition tone. */
export const toothTone = {
  idle: { fill: "#FFFFFF", stroke: "#CBDDE6", text: ink.soft },
  healthy: { fill: accent[50], stroke: accent[300], text: accent[700] },
  treated: { fill: brand[100], stroke: brand[400], text: brand[700] },
  planned: { fill: semantic.warningSoft, stroke: semantic.warning, text: semantic.warningInk },
  danger: { fill: semantic.dangerSoft, stroke: semantic.danger, text: semantic.dangerInk },
  warning: { fill: semantic.warningSoft, stroke: semantic.warning, text: semantic.warningInk },
  missing: { fill: surface.lineSoft, stroke: surface.line, text: ink.faint },
  selected: { fill: brand[100], stroke: brand[600], text: brand[700] },
};

export const theme = {
  brand,
  accent,
  ink,
  semantic,
  surface,
  gradient,
  chart,
  chartSeries,
  toothTone,
};

export default theme;
