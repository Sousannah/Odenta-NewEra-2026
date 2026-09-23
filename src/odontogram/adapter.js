/**
 * From the odontogram payload to Odenta's chart entries.
 *
 * The tooth chart records far more than Odenta's entry list can hold — pulp and
 * apical diagnoses, per-surface ICDAS and radiographic depth, filling materials,
 * peri-implant staging, six-point probing. That richness is why the payload is
 * what gets stored: it is the chart of record and nothing is thrown away.
 *
 * But a chart is also read by screens that never open it — the supervisor's
 * dossier, the case condition/procedure tallies, the "Charted record" tables,
 * the treatment planner. Those speak Odenta's flat vocabulary, so every save
 * derives that list from the payload and stores it alongside. The derivation is
 * one-way and lossy on purpose: it is a projection for reading, never a second
 * copy to edit. Nothing writes entries back into a payload.
 *
 * Two vocabularies come out of here because the two portals genuinely have
 * two — see `ARCHITECTURE.md`. The clinic charts a *condition* per fact
 * (`toClinicEntries`); the university charts a *condition* and a *procedure*
 * together on one row per tooth (`toUniversityEntries`).
 */

import { isAnterior } from "@/components/dental/notation";

/* ------------------------------------------------------------- surfaces */

/** Module surface name → clinic surface code. Occlusal reads incisal on an
 *  anterior tooth, which is why the tooth number is needed. */
function clinicSurface(surface, tooth) {
  switch (surface) {
    case "mesial":
      return "M";
    case "distal":
      return "D";
    case "buccal":
      return "B";
    case "lingual":
      return "L";
    case "occlusal":
      return isAnterior(tooth) ? "I" : "O";
    default:
      return null;
  }
}

const isUpper = (tooth) => [1, 2, 5, 6].includes(Number(String(tooth)[0]));

/** Module surface name → university surface name (which distinguishes the
 *  palatal and lingual sides, and the incisal edge from the occlusal table). */
function universitySurface(surface, tooth) {
  switch (surface) {
    case "lingual":
      return isUpper(tooth) ? "palatal" : "lingual";
    case "occlusal":
      return isAnterior(tooth) ? "incisal" : "occlusal";
    case "mesial":
    case "distal":
    case "buccal":
      return surface;
    default:
      return null;
  }
}

const clean = (list) => list.filter(Boolean);

/* ---------------------------------------------------------- state reads */

const CROWN_RESTORATIONS = new Set(["crown", "inlay", "onlay", "veneer", "bridge"]);

const isMissing = (state) => state.toothSelection === "none";
const isImplant = (state) => state.toothSelection === "implant";

/** Caries surfaces that are *not* under a filling. A carious surface that also
 *  carries a filling is recurrent decay around a restoration, which the clinic
 *  charts as the restoration failing rather than as fresh caries. */
function primaryCaries(state) {
  const filled = new Set(state.fillingSurfaces ?? []);
  return (state.caries ?? []).filter((surface) => !filled.has(surface));
}

/** The worst per-surface caries severity on the tooth, as an ICDAS code. */
function worstSeverity(state, surfaces) {
  const severities = surfaces
    .map((surface) => Number(state.cariesSeverity?.[surface]))
    .filter((value) => Number.isFinite(value) && value > 0);
  return severities.length ? Math.max(...severities) : null;
}

const isFractured = (state) =>
  !!state.brokenMesial ||
  !!state.brokenIncisal ||
  !!state.brokenDistal ||
  state.toothSubstrate === "broken";

const hasAbscess = (state) =>
  state.periapicalType === "abscess" ||
  state.apicalDx === "acute-apical-abscess" ||
  state.apicalDx === "chronic-apical-abscess";

const hasPeriapical = (state) =>
  (state.apicalDx && state.apicalDx !== "normal") ||
  (state.periapicalType && state.periapicalType !== "none") ||
  (state.mods ?? []).includes("inflammation");

const hasPulpitis = (state) =>
  state.pulpDx === "reversible-pulpitis" || state.pulpDx === "irreversible-pulpitis";

/** Teeth the clinician has actually touched. Charting is sparse — the payload
 *  always carries all 32 teeth, most of them at their defaults. */
function chartedTeeth(payload) {
  const teeth = payload?.teeth ?? {};
  return Object.entries(teeth).filter(([, state]) => state && hasAnyFinding(state));
}

function hasAnyFinding(state) {
  return (
    (state.toothSelection && state.toothSelection !== "tooth-base") ||
    (state.caries ?? []).length > 0 ||
    (state.fillingSurfaces ?? []).length > 0 ||
    (state.mods ?? []).length > 0 ||
    (state.endo && state.endo !== "none") ||
    (state.restorationType && state.restorationType !== "none") ||
    (state.prosthesis && state.prosthesis !== "none") ||
    (state.rootCaries && state.rootCaries !== "none") ||
    (state.wearEdge && state.wearEdge !== "none") ||
    (state.wearCervical && state.wearCervical !== "none") ||
    (state.discoloration && state.discoloration !== "none") ||
    (state.mobility && state.mobility !== "none") ||
    (state.resorptionType && state.resorptionType !== "none") ||
    (state.pulpDx && state.pulpDx !== "normal") ||
    (state.apicalDx && state.apicalDx !== "normal") ||
    (state.periapicalType && state.periapicalType !== "none") ||
    (state.orthoAppliance && state.orthoAppliance !== "none") ||
    isFractured(state) ||
    !!state.fissureSealing ||
    !!state.calculus ||
    !!state.extractionWound ||
    !!state.extractionPlan ||
    !!state.crownNeeded ||
    !!state.crownReplace ||
    !!state.bridgePillar ||
    !!(state.note && String(state.note).trim())
  );
}

/* ------------------------------------------------------ clinic entries */

/**
 * Odenta clinic entries: one fact about one tooth, optionally scoped to
 * surfaces, in the vocabulary of `TOOTH_CONDITIONS`.
 *
 * @param payload - the odontogram status payload
 * @param meta - `{ dentistId, date }` stamped on every derived entry
 * @returns `[{ id, tooth, surfaces, condition, status, icdas, note, date, dentistId }]`
 */
export function toClinicEntries(payload, meta = {}) {
  const date = meta.date ?? new Date().toISOString().slice(0, 10);
  const dentistId = meta.dentistId ?? null;
  const entries = [];

  let sequence = 0;
  const push = (tooth, condition, status, extra = {}) => {
    sequence += 1;
    entries.push({
      id: `CH-ODO-${tooth}-${sequence}`,
      tooth: Number(tooth),
      surfaces: [],
      condition,
      status,
      code: null,
      note: "",
      date,
      dentistId,
      ...extra,
    });
  };

  for (const [tooth, state] of chartedTeeth(payload)) {
    const note = (state.note ?? "").trim();

    if (isMissing(state)) {
      push(tooth, "missing", "condition", { note });
      continue;
    }

    if (isImplant(state)) {
      push(tooth, "implant", "completed", { note });
    }

    const caries = primaryCaries(state);
    if (caries.length) {
      push(tooth, "caries", state.extractionPlan ? "planned" : "condition", {
        surfaces: clean(caries.map((surface) => clinicSurface(surface, tooth))),
        icdas: worstSeverity(state, caries),
        note,
      });
    }

    if ((state.fillingSurfaces ?? []).length) {
      push(tooth, "restoration", "completed", {
        surfaces: clean(state.fillingSurfaces.map((surface) => clinicSurface(surface, tooth))),
      });
    }

    if (CROWN_RESTORATIONS.has(state.restorationType)) {
      push(tooth, "crown", "completed");
    } else if (state.crownNeeded) {
      push(tooth, "crown", "planned");
    }

    if (state.endo && state.endo !== "none") {
      push(tooth, "rct", "completed");
    }

    if (hasPulpitis(state)) push(tooth, "pulpitis", "condition");
    if (hasPeriapical(state)) push(tooth, "periapical", "condition");
    if (isFractured(state)) push(tooth, "fracture", "condition");

    if (state.wearEdge === "attrition") push(tooth, "attrition", "condition");
    if (state.wearEdge === "erosion" || state.wearCervical === "erosion") {
      push(tooth, "erosion", "condition");
    }

    if (state.mobility && state.mobility !== "none") push(tooth, "mobility", "condition");

    /* A planned extraction has no condition of its own in the clinic
       vocabulary — it is the tooth's future absence, charted as planned. */
    if (state.extractionPlan) push(tooth, "missing", "planned");
  }

  return entries;
}

/* -------------------------------------------------- university entries */

const UNI_FILLING_PROCEDURE = {
  amalgam: "Amalgam",
  composite: "Composite",
  gic: "Filling",
  temporary: "Filling",
};

/** The single procedure that best describes what was done to this tooth. The
 *  university chart holds one per row, most-definitive first. */
function universityProcedure(state) {
  if (state.extractionWound || state.extractionPlan) return "Extraction";
  if (isImplant(state)) return "Implant";
  if (CROWN_RESTORATIONS.has(state.restorationType)) return "Crown";
  if (state.endo && state.endo !== "none") return "Root Canal";
  const materials = Object.values(state.fillingSurfaceMaterials ?? {});
  for (const material of materials) {
    if (UNI_FILLING_PROCEDURE[material]) return UNI_FILLING_PROCEDURE[material];
  }
  if ((state.fillingSurfaces ?? []).length) return "Filling";
  if (state.calculus) return "Scaling";
  return "N/A";
}

/** The single condition that best describes what the tooth is doing. */
function universityCondition(state) {
  if (isMissing(state)) return "Missing";
  if (hasAbscess(state)) return "Abscess";
  if (primaryCaries(state).length || (state.rootCaries && state.rootCaries !== "none")) {
    return "Decayed";
  }
  if (isFractured(state)) return "Fractured";
  if (state.crownLeakage || state.resorptionType !== "none") return "Cracked";
  /* "Filled" is the university vocabulary's word for restored — a crowned or
     inlaid tooth belongs here rather than under "Healthy", which would read as
     untouched. */
  if ((state.fillingSurfaces ?? []).length || CROWN_RESTORATIONS.has(state.restorationType)) {
    return "Filled";
  }
  return "Healthy";
}

/**
 * University entries: one row per charted tooth, carrying both a condition and
 * a procedure — `"N/A"` where nothing was recorded, matching how the paper
 * chart leaves a blank.
 *
 * @param payload - the odontogram status payload
 * @param meta - `{ by, date }` stamped on every derived row
 * @returns `[{ tooth, surfaces, condition, procedure, status, note, date, by }]`
 */
export function toUniversityEntries(payload, meta = {}) {
  const date = meta.date ?? new Date().toISOString().slice(0, 10);
  const by = meta.by ?? "";

  return chartedTeeth(payload).map(([tooth, state]) => {
    const procedure = universityProcedure(state);
    const surfaces = clean(
      [...new Set([...(state.caries ?? []), ...(state.fillingSurfaces ?? [])])].map((surface) =>
        universitySurface(surface, tooth)
      )
    );

    return {
      tooth: String(tooth),
      surfaces,
      condition: universityCondition(state),
      procedure,
      status:
        procedure !== "N/A"
          ? "completed"
          : state.extractionPlan || state.crownNeeded
            ? "planned"
            : "condition",
      note: (state.note ?? "").trim(),
      date,
      by,
    };
  });
}

/* ---------------------------------------------------------------- shape */

/**
 * What a chart save sends and a chart load returns.
 *
 * `odontogram` is the chart of record; `chart` is the derived read model. A
 * record saved before the new chart existed has only `chart`, which is why
 * `readChartPayload` tolerates a bare array.
 */
export const buildChartDocument = (payload, entries) => ({
  odontogram: payload ?? null,
  chart: entries ?? [],
});

/** The odontogram payload out of whatever the chart endpoint returned. */
export function readChartPayload(stored) {
  if (!stored) return null;
  if (Array.isArray(stored)) return null; // legacy: entries only, no payload yet
  return stored.odontogram ?? null;
}

/** The flat entry list out of whatever the chart endpoint returned. */
export function readChartEntries(stored) {
  if (!stored) return [];
  if (Array.isArray(stored)) return stored;
  return stored.chart ?? [];
}
