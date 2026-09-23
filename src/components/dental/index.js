/**
 * Dental primitives.
 *
 * The odontogram itself now lives in `src/odontogram` — the vendored React
 * Advanced Odontogram, wrapped as `ToothChart`, used by every charting screen.
 * What stays here is the vocabulary around it: FDI identity and notation
 * conversion (`notation.js`), which billing, lab cases and the treatment
 * planner all read, and the six-point periodontal grid, which has its own
 * store and its own endpoint.
 */
export { PerioChart, perioSummary } from "./PerioChart";
export * from "./notation";
