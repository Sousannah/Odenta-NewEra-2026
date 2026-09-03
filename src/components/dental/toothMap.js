/**
 * FDI (ISO 3950) two-digit tooth notation.
 *   Quadrant 1 = upper right, 2 = upper left, 3 = lower left, 4 = lower right.
 *   Position  1 = central incisor … 8 = third molar.
 */
export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
export const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

/** Left-to-right visual order for each arch. */
export const UPPER_ARCH = [...UPPER_RIGHT, ...UPPER_LEFT];
export const LOWER_ARCH = [...LOWER_RIGHT, ...LOWER_LEFT];
export const ALL_TEETH = [...UPPER_ARCH, ...LOWER_ARCH];

const POSITION_NAMES = {
  1: "Central Incisor",
  2: "Lateral Incisor",
  3: "Canine",
  4: "1st Premolar",
  5: "2nd Premolar",
  6: "1st Molar",
  7: "2nd Molar",
  8: "3rd Molar",
};

const QUADRANT_NAMES = {
  1: "Upper right",
  2: "Upper left",
  3: "Lower left",
  4: "Lower right",
};

export const toothPosition = (tooth) => Number(String(tooth)[1]);
export const toothQuadrant = (tooth) => Number(String(tooth)[0]);
export const toothName = (tooth) => POSITION_NAMES[toothPosition(tooth)] ?? "Tooth";
export const toothQuadrantName = (tooth) => QUADRANT_NAMES[toothQuadrant(tooth)] ?? "";
export const isUpper = (tooth) => toothQuadrant(tooth) <= 2;

/** Coarse shape family, drives how the tooth is drawn. */
export const toothKind = (tooth) => {
  const position = toothPosition(tooth);
  if (position <= 2) return "incisor";
  if (position === 3) return "canine";
  if (position <= 5) return "premolar";
  return "molar";
};

export const ARCH_LABELS = {
  maxilla: "Maxilla",
  mandible: "Mandible",
};
