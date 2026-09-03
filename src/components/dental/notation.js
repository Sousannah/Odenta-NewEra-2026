/**
 * Tooth identity and notation conversion.
 *
 * Internally every tooth is an FDI (ISO 3950) two-digit number — one canonical
 * key across charting, billing and lab cases. Display notation is a user
 * preference, converted at the edge.
 *
 *   Quadrant 1 = permanent upper right   5 = primary upper right
 *   Quadrant 2 = permanent upper left    6 = primary upper left
 *   Quadrant 3 = permanent lower left    7 = primary lower left
 *   Quadrant 4 = permanent lower right   8 = primary lower right
 */

export const NOTATIONS = {
  FDI: "fdi",
  UNIVERSAL: "universal",
  PALMER: "palmer",
};

export const NOTATION_OPTIONS = [
  { value: NOTATIONS.FDI, label: "FDI (ISO 3950)" },
  { value: NOTATIONS.UNIVERSAL, label: "Universal (ADA)" },
  { value: NOTATIONS.PALMER, label: "Palmer" },
];

/* ------------------------------------------------------------- dentitions */

export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
export const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

/** Left-to-right as the clinician sees the patient. */
export const UPPER_ARCH = [...UPPER_RIGHT, ...UPPER_LEFT];
export const LOWER_ARCH = [...LOWER_RIGHT, ...LOWER_LEFT];
export const PERMANENT_TEETH = [...UPPER_ARCH, ...LOWER_ARCH];

export const PRIMARY_UPPER_RIGHT = [55, 54, 53, 52, 51];
export const PRIMARY_UPPER_LEFT = [61, 62, 63, 64, 65];
export const PRIMARY_LOWER_RIGHT = [85, 84, 83, 82, 81];
export const PRIMARY_LOWER_LEFT = [71, 72, 73, 74, 75];

export const PRIMARY_UPPER_ARCH = [...PRIMARY_UPPER_RIGHT, ...PRIMARY_UPPER_LEFT];
export const PRIMARY_LOWER_ARCH = [...PRIMARY_LOWER_RIGHT, ...PRIMARY_LOWER_LEFT];
export const PRIMARY_TEETH = [...PRIMARY_UPPER_ARCH, ...PRIMARY_LOWER_ARCH];

export const QUADRANTS = {
  1: { label: "Upper right", arch: "maxilla", side: "right" },
  2: { label: "Upper left", arch: "maxilla", side: "left" },
  3: { label: "Lower left", arch: "mandible", side: "left" },
  4: { label: "Lower right", arch: "mandible", side: "right" },
  5: { label: "Upper right (primary)", arch: "maxilla", side: "right" },
  6: { label: "Upper left (primary)", arch: "maxilla", side: "left" },
  7: { label: "Lower left (primary)", arch: "mandible", side: "left" },
  8: { label: "Lower right (primary)", arch: "mandible", side: "right" },
};

/* -------------------------------------------------------------- accessors */

export const toothQuadrant = (tooth) => Number(String(tooth)[0]);
export const toothPosition = (tooth) => Number(String(tooth)[1]);
export const isPrimary = (tooth) => toothQuadrant(tooth) >= 5;
export const isUpper = (tooth) => [1, 2, 5, 6].includes(toothQuadrant(tooth));
export const isAnterior = (tooth) => toothPosition(tooth) <= 3;
export const isPosterior = (tooth) => !isAnterior(tooth);
export const archOf = (tooth) => (isUpper(tooth) ? "maxilla" : "mandible");

const PERMANENT_NAMES = {
  1: "Central Incisor",
  2: "Lateral Incisor",
  3: "Canine",
  4: "1st Premolar",
  5: "2nd Premolar",
  6: "1st Molar",
  7: "2nd Molar",
  8: "3rd Molar",
};

const PRIMARY_NAMES = {
  1: "Central Incisor",
  2: "Lateral Incisor",
  3: "Canine",
  4: "1st Molar",
  5: "2nd Molar",
};

export const toothName = (tooth) =>
  (isPrimary(tooth) ? PRIMARY_NAMES : PERMANENT_NAMES)[toothPosition(tooth)] ?? "Tooth";

/** "Maxillary Left Lateral Incisor" — the phrasing used in clinical notes. */
export const toothFullName = (tooth) => {
  const quadrant = QUADRANTS[toothQuadrant(tooth)];
  if (!quadrant) return `Tooth ${tooth}`;
  const arch = quadrant.arch === "maxilla" ? "Maxillary" : "Mandibular";
  const side = quadrant.side === "left" ? "Left" : "Right";
  const primary = isPrimary(tooth) ? "Primary " : "";
  return `${primary}${arch} ${side} ${toothName(tooth)}`;
};

/** Shape family used by the odontogram glyphs. */
export const toothKind = (tooth) => {
  const position = toothPosition(tooth);
  if (isPrimary(tooth)) return position <= 2 ? "incisor" : position === 3 ? "canine" : "molar";
  if (position <= 2) return "incisor";
  if (position === 3) return "canine";
  if (position <= 5) return "premolar";
  return "molar";
};

/* ------------------------------------------------------------ conversions */

/** FDI → Universal (1–32 permanent, A–T primary). */
const UNIVERSAL_PERMANENT = {
  18: 1, 17: 2, 16: 3, 15: 4, 14: 5, 13: 6, 12: 7, 11: 8,
  21: 9, 22: 10, 23: 11, 24: 12, 25: 13, 26: 14, 27: 15, 28: 16,
  38: 17, 37: 18, 36: 19, 35: 20, 34: 21, 33: 22, 32: 23, 31: 24,
  41: 25, 42: 26, 43: 27, 44: 28, 45: 29, 46: 30, 47: 31, 48: 32,
};

const UNIVERSAL_PRIMARY = {
  55: "A", 54: "B", 53: "C", 52: "D", 51: "E",
  61: "F", 62: "G", 63: "H", 64: "I", 65: "J",
  75: "K", 74: "L", 73: "M", 72: "N", 71: "O",
  81: "P", 82: "Q", 83: "R", 84: "S", 85: "T",
};

export const toUniversal = (tooth) =>
  isPrimary(tooth) ? UNIVERSAL_PRIMARY[tooth] : UNIVERSAL_PERMANENT[tooth];

/**
 * Palmer: position number plus a quadrant bracket. Rendered here with the
 * conventional corner glyphs so it reads correctly in plain text.
 */
const PALMER_BRACKET = {
  1: "⌜", // upper right  ⌜
  2: "⌝", // upper left   ⌝
  3: "⌟", // lower left   ⌟
  4: "⌞", // lower right  ⌞
  5: "⌜",
  6: "⌝",
  7: "⌟",
  8: "⌞",
};

export const toPalmer = (tooth) => {
  const position = toothPosition(tooth);
  const bracket = PALMER_BRACKET[toothQuadrant(tooth)] ?? "";
  const label = isPrimary(tooth) ? ["", "A", "B", "C", "D", "E"][position] : position;
  return `${bracket}${label}`;
};

/** Format one tooth for display in the user's chosen notation. */
export function formatTooth(tooth, notation = NOTATIONS.FDI) {
  if (tooth == null) return "—";
  switch (notation) {
    case NOTATIONS.UNIVERSAL:
      return String(toUniversal(tooth) ?? tooth);
    case NOTATIONS.PALMER:
      return toPalmer(tooth);
    default:
      return String(tooth);
  }
}

/** "16, 17, 18" or "3, 2, 1" depending on notation. */
export const formatTeeth = (teeth = [], notation = NOTATIONS.FDI) =>
  teeth.map((tooth) => formatTooth(tooth, notation)).join(", ");

/* ------------------------------------------------------------- surfaces */

import { ANTERIOR_SURFACES, POSTERIOR_SURFACES, SURFACES } from "@/config/dentalStandards";

export const surfacesFor = (tooth) =>
  isAnterior(tooth) ? ANTERIOR_SURFACES : POSTERIOR_SURFACES;

export const surfaceLabel = (code) => SURFACES[code]?.label ?? code;

/** "MOD" — the conventional shorthand for a multi-surface restoration. */
export const formatSurfaces = (codes = []) => {
  const order = ["M", "O", "I", "D", "B", "L"];
  return [...codes].sort((a, b) => order.indexOf(a) - order.indexOf(b)).join("");
};
