import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import OdontogramShell from "./lib/App";
import {
  getStatusChart,
  importStatus,
  getOdontogramSummary,
  onStateChange,
} from "./lib/odontogram";
import { getI18nLanguage } from "./lib/i18n/useI18n";
import { odontogramTheme } from "./theme";
import { DEFAULT_LANGUAGE, VISIBLE_LANGUAGES } from "./config";

import "./lib/index.css";
import "./odenta-skin.css";

/**
 * The tooth chart.
 *
 * One charting surface for the whole product — the dentist's patient record,
 * the student's case, the supervisor's dossier, the chairside checkup. It wraps
 * the vendored React Advanced Odontogram (`./lib`, dropped in as-is) and gives
 * it three things Odenta needs and the module does not assume:
 *
 *  1. **The Odenta look** — `themeConfig` maps the module's eight colour slots
 *     onto `src/theme/tokens.js`, `odenta-skin.css` does the rest.
 *  2. **A value/onChange contract** — the module keeps its state in an
 *     imperative engine, not in React. `value` is loaded in on mount and
 *     whenever the identity of the record changes; `onChange` fires with the
 *     full status payload once edits settle.
 *  3. **Two sizes** — `variant="full"` is the editor (top bar, chart, control
 *     panel); `variant="compact"` is the chart alone, for the read-only
 *     previews that sit in side panels and dossiers.
 *
 * ## One at a time
 *
 * The engine underneath is a module-level singleton — `initOdontogram()` wires
 * one live chart to the DOM. Two mounted `ToothChart`s would fight over it, so
 * a screen shows one at a time (a modal chart means the page behind it is not
 * also rendering one). In development a second mount logs a warning rather
 * than failing quietly.
 *
 * ## Why the payload is opaque
 *
 * `value` / `onChange` carry the module's own status JSON (`{version, globals,
 * teeth, case?}`) verbatim. Odenta stores it as-is and never reaches inside:
 * the module owns that schema and evolves it, and it round-trips losslessly
 * through the same `importStatus`/`getStatusChart` pair the module's own export
 * uses. Anything the rest of the app needs *about* a chart — how many teeth are
 * charted, what is carious — comes from `getSummary()` on the ref, not from
 * parsing the payload.
 */

/** How long edits settle before `onChange` fires. Matches the module's own
 *  persistence debounce, so a burst (a preset touching many teeth) is one call. */
const CHANGE_DEBOUNCE_MS = 400;

let liveInstances = 0;

const ToothChart = forwardRef(function ToothChart(
  {
    value,
    onChange,
    readOnly = false,
    variant = "full",
    language,
    defaultLanguage,
    onLanguageChange,
    numbering,
    defaultNumbering = "FDI",
    onNumberingChange,
    panelMaxHeight,
    className,
    ...moduleProps
  },
  ref
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /*
   * Language and numbering are controlled *here* rather than passed straight
   * through. The module reads a bare `language` prop as "the host owns this",
   * and then its own picker only reports the choice instead of applying it —
   * so handing it a constant would leave both menus visibly dead. Owning the
   * state means the pickers work out of the box, and a host that wants to
   * persist the choice still can by passing `language` + `onLanguageChange`.
   *
   * The seed comes from the module's global current language, so moving
   * between charting screens does not silently reset a clinician's choice.
   */
  const [ownLanguage, setOwnLanguage] = useState(() => {
    const seed = defaultLanguage ?? getI18nLanguage();
    /* Never open in a locale the menu does not offer — there would be no way
       back out of it. */
    return VISIBLE_LANGUAGES.includes(seed) ? seed : DEFAULT_LANGUAGE;
  });
  const [ownNumbering, setOwnNumbering] = useState(defaultNumbering);

  const activeLanguage = language ?? ownLanguage;
  const activeNumbering = numbering ?? ownNumbering;

  /* The payload currently *in* the engine. Guards the echo: every import we
     perform raises a state change, which would otherwise bounce straight back
     out through onChange as if the user had edited something. */
  const loadedRef = useRef(null);
  const timerRef = useRef(null);

  const commit = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const payload = getStatusChart();
    loadedRef.current = payload;
    onChangeRef.current?.(payload);
    return payload;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      /** The chart as it stands, in the module's status-payload shape. */
      getPayload: () => getStatusChart(),
      /** Replace the chart contents. */
      setPayload: (payload) => {
        loadedRef.current = payload ?? null;
        importStatus(payload ?? {});
      },
      /** Counts and per-tooth findings, for screens that summarise a chart. */
      getSummary: () => getOdontogramSummary(),
      /** Fire `onChange` now rather than waiting out the debounce — what a
       *  "Save" button calls so it never writes a stale payload. */
      commit,
    }),
    [commit]
  );

  /*
   * Runs AFTER the provider's own `initOdontogram()` effect — this component is
   * the parent of `OdontogramProvider`, and React commits child effects first.
   * That ordering is the whole reason the load lives here rather than in a
   * child of the provider: importing into an engine that has not wired its DOM
   * yet would paint nothing.
   */
  useEffect(() => {
    if (import.meta.env.DEV) {
      liveInstances += 1;
      if (liveInstances > 1) {
        console.warn(
          "[ToothChart] More than one chart is mounted. The odontogram engine " +
            "is a singleton — the instances will overwrite each other's state."
        );
      }
    }

    if (value) importStatus(value);
    /* Read the baseline back out of the engine rather than trusting `value`.
       Importing fills in every default, so the payload the engine now holds is
       not byte-identical to what went in — and with no `value` at all there is
       still a baseline (the empty chart) to compare against. Without this, the
       state change the engine raises at mount would look like an edit and the
       screen would open already dirty. */
    loadedRef.current = getStatusChart();

    const unsubscribe = onStateChange(() => {
      if (!onChangeRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const payload = getStatusChart();
        /* Ignore the change our own import raised. */
        if (JSON.stringify(payload) === JSON.stringify(loadedRef.current)) return;
        loadedRef.current = payload;
        onChangeRef.current?.(payload);
      }, CHANGE_DEBOUNCE_MS);
    });

    return () => {
      if (import.meta.env.DEV) liveInstances -= 1;
      if (timerRef.current) clearTimeout(timerRef.current);
      unsubscribe();
    };
    // Mount-only: `value` is a seed, not a controlled prop. Reloading a record
    // is expressed by remounting (see the `key` on every call site).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Commit anything still in flight when the chart goes away — closing a modal
     must not drop the last edit. */
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        onChangeRef.current?.(getStatusChart());
      }
    },
    []
  );

  return (
    <div
      className={cn(
        "odenta-odontogram",
        variant === "compact" && "odenta-odontogram--compact",
        readOnly && "odenta-odontogram--readonly",
        className
      )}
      style={panelMaxHeight ? { "--odon-panel-max-h": panelMaxHeight } : undefined}
    >
      <OdontogramShell
        themeConfig={odontogramTheme}
        language={activeLanguage}
        onLanguageChange={(next) => {
          setOwnLanguage(next);
          onLanguageChange?.(next);
        }}
        numberingSystem={activeNumbering}
        onNumberingChange={(next) => {
          setOwnNumbering(next);
          onNumberingChange?.(next);
        }}
        darkMode={false}
        readOnly={readOnly}
        {...moduleProps}
      />
    </div>
  );
});

export default ToothChart;
export { ToothChart };
