/**
 * The tooth chart.
 *
 * `lib/` is the React Advanced Odontogram module, vendored verbatim apart from
 * four integration edits, each marked `Odenta:` at the site:
 *
 *   - `index.css` — the three document-level rules (`*`, `html,body`, `body`)
 *     and the two bare `select` rules are scoped to `.odontogram-root`, and the
 *     hardcoded accent tints now resolve through `--odon-accent-rgb` /
 *     `--odon-accent2-rgb` so the host palette reaches them.
 *   - `surfaces/OdontogramTopbar.tsx` + `SettingsModal.tsx` — the language menus
 *     are filtered through `VISIBLE_LANGUAGES`. All twelve translations stay.
 *   - `OdontogramContext.tsx` — the selection ring defaults to brand-600, and
 *     the `.dark` class is removed on unmount so a chart cannot leave the host
 *     app in dark mode.
 *
 * Everything else — `odenta-skin.css`, `theme.js`, `config.js`, `ToothChart` —
 * sits outside `lib/`, so re-vendoring a newer module version is a folder
 * replace plus those four edits.
 *
 * Screens import from here, never from `./lib` directly.
 */

export { default as ToothChart } from "./ToothChart";
export { odontogramTheme } from "./theme";
export {
  VISIBLE_LANGUAGES,
  DEFAULT_LANGUAGE,
  RTL_LANGUAGES,
  isRtlLanguage,
} from "./config";

/**
 * Engine verbs a screen may need around the chart — exporting a report,
 * summarising a chart for a header, reading the current payload for a save
 * button. Interaction with the chart itself goes through the `ToothChart` ref.
 */
export {
  getStatusChart,
  importStatus,
  getOdontogramSummary,
  getToothStateSummary,
  formatToothLabel,
  onStateChange,
  exportFhir,
  exportPdf,
  exportImage,
  exportSvg,
  hasAnyPerioData,
} from "./lib/odontogram";

/**
 * Chart storage. The payload is the chart of record; the flat entry list is a
 * derived read model for the screens that never open the chart.
 */
export {
  toClinicEntries,
  toUniversityEntries,
  buildChartDocument,
  readChartPayload,
  readChartEntries,
} from "./adapter";
