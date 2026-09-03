/**
 * Clinical reference data the UI is built against.
 *
 * These are abbreviated working sets, not exhaustive code books — enough for
 * the charting, planning and billing flows to behave like the real thing.
 * When the backend lands, these should come from a maintained catalogue
 * (CDT is republished annually and is licensed by the ADA).
 */

/* ------------------------------------------------------ tooth surfaces */

/**
 * Surface codes used on restorative charting.
 * Anteriors use Incisal, posteriors use Occlusal — the odontogram picks the
 * right label from the tooth type.
 */
export const SURFACES = {
  M: { code: "M", label: "Mesial" },
  D: { code: "D", label: "Distal" },
  B: { code: "B", label: "Buccal / Facial" },
  L: { code: "L", label: "Lingual / Palatal" },
  O: { code: "O", label: "Occlusal" },
  I: { code: "I", label: "Incisal" },
};

export const POSTERIOR_SURFACES = ["M", "O", "D", "B", "L"];
export const ANTERIOR_SURFACES = ["M", "I", "D", "B", "L"];

/* ------------------------------------------------- charting conditions */

/**
 * Findings a clinician records on a tooth. `tone` drives the odontogram
 * colour; `surface` says whether the finding is charted per-surface.
 */
export const TOOTH_CONDITIONS = [
  { value: "sound", short: "snd", label: "Sound", tone: "healthy", surface: false, icd: null },
  { value: "caries", short: "car", label: "Caries", tone: "danger", surface: true, icd: "K02.9" },
  { value: "restoration", short: "res", label: "Existing restoration", tone: "treated", surface: true, icd: null },
  { value: "fracture", short: "frx", label: "Fracture", tone: "danger", surface: true, icd: "S02.5" },
  { value: "attrition", short: "att", label: "Attrition / wear", tone: "warning", surface: true, icd: "K03.0" },
  { value: "erosion", short: "ero", label: "Erosion", tone: "warning", surface: true, icd: "K03.2" },
  { value: "pulpitis", short: "pul", label: "Pulpitis", tone: "danger", surface: false, icd: "K04.0" },
  { value: "periapical", short: "per", label: "Periapical lesion", tone: "danger", surface: false, icd: "K04.5" },
  { value: "impacted", short: "imp", label: "Impacted", tone: "warning", surface: false, icd: "K01.1" },
  { value: "missing", short: "mis", label: "Missing", tone: "missing", surface: false, icd: "K08.109" },
  { value: "implant", short: "imn", label: "Implant", tone: "treated", surface: false, icd: null },
  { value: "crown", short: "crn", label: "Crown present", tone: "treated", surface: false, icd: null },
  { value: "rct", short: "rct", label: "Root filled", tone: "treated", surface: false, icd: null },
  { value: "mobility", short: "mob", label: "Mobility", tone: "warning", surface: false, icd: "K08.89" },
];

export const conditionByValue = (value) =>
  TOOTH_CONDITIONS.find((item) => item.value === value) ?? null;

/**
 * ICDAS II — International Caries Detection and Assessment System.
 * Used on the charting popover so a finding carries a severity, not just a name.
 */
export const ICDAS_CODES = [
  { code: 0, label: "Sound", detail: "No or slight change in enamel translucency" },
  { code: 1, label: "First visual change", detail: "Visible only after air drying" },
  { code: 2, label: "Distinct visual change", detail: "Visible when wet" },
  { code: 3, label: "Localised enamel breakdown", detail: "No dentine visible" },
  { code: 4, label: "Underlying dentine shadow", detail: "Enamel intact" },
  { code: 5, label: "Distinct cavity", detail: "Visible dentine" },
  { code: 6, label: "Extensive cavity", detail: "More than half the surface" },
];

/* --------------------------------------------------- procedure catalogue */

/**
 * CDT-style procedure codes grouped by category of service. Prices are the
 * clinic's own fee schedule; the code is what an insurer reads.
 */
export const PROCEDURE_CATEGORIES = [
  "Diagnostic",
  "Preventive",
  "Restorative",
  "Endodontics",
  "Periodontics",
  "Prosthodontics",
  "Oral Surgery",
  "Orthodontics",
  "Cosmetic",
];

export const PROCEDURE_CODES = [
  { code: "D0120", label: "Periodic oral evaluation", category: "Diagnostic" },
  { code: "D0140", label: "Limited oral evaluation — problem focused", category: "Diagnostic" },
  { code: "D0210", label: "Intraoral complete series of radiographs", category: "Diagnostic" },
  { code: "D0220", label: "Intraoral periapical — first image", category: "Diagnostic" },
  { code: "D0274", label: "Bitewings — four images", category: "Diagnostic" },
  { code: "D0330", label: "Panoramic radiographic image", category: "Diagnostic" },
  { code: "D1110", label: "Prophylaxis — adult", category: "Preventive" },
  { code: "D1206", label: "Topical fluoride varnish", category: "Preventive" },
  { code: "D1351", label: "Sealant — per tooth", category: "Preventive" },
  { code: "D2140", label: "Amalgam — one surface", category: "Restorative" },
  { code: "D2391", label: "Resin composite — one surface, posterior", category: "Restorative" },
  { code: "D2392", label: "Resin composite — two surfaces, posterior", category: "Restorative" },
  { code: "D2740", label: "Crown — porcelain / ceramic", category: "Restorative" },
  { code: "D2950", label: "Core buildup, including any pins", category: "Restorative" },
  { code: "D3310", label: "Endodontic therapy — anterior tooth", category: "Endodontics" },
  { code: "D3330", label: "Endodontic therapy — molar", category: "Endodontics" },
  { code: "D4341", label: "Scaling and root planing — four or more teeth per quadrant", category: "Periodontics" },
  { code: "D4346", label: "Scaling in presence of generalised moderate gingival inflammation", category: "Periodontics" },
  { code: "D4910", label: "Periodontal maintenance", category: "Periodontics" },
  { code: "D5110", label: "Complete denture — maxillary", category: "Prosthodontics" },
  { code: "D6010", label: "Surgical placement of implant body", category: "Prosthodontics" },
  { code: "D6240", label: "Pontic — porcelain fused to high noble metal", category: "Prosthodontics" },
  { code: "D7140", label: "Extraction — erupted tooth or exposed root", category: "Oral Surgery" },
  { code: "D7210", label: "Surgical extraction — erupted tooth requiring elevation", category: "Oral Surgery" },
  { code: "D7240", label: "Removal of impacted tooth — completely bony", category: "Oral Surgery" },
  { code: "D8080", label: "Comprehensive orthodontic treatment — adolescent", category: "Orthodontics" },
  { code: "D9944", label: "Occlusal guard — hard appliance, full arch", category: "Orthodontics" },
  { code: "D9972", label: "External bleaching — per arch", category: "Cosmetic" },
];

export const procedureByCode = (code) =>
  PROCEDURE_CODES.find((item) => item.code === code) ?? null;

/* ------------------------------------------------------ periodontal chart */

/** Six probing sites per tooth, buccal row then lingual row. */
export const PERIO_SITES = ["DB", "B", "MB", "DL", "L", "ML"];

export const PERIO_SITE_LABELS = {
  DB: "Disto-buccal",
  B: "Buccal",
  MB: "Mesio-buccal",
  DL: "Disto-lingual",
  L: "Lingual",
  ML: "Mesio-lingual",
};

export const MOBILITY_GRADES = [
  { value: 0, label: "0 — physiologic" },
  { value: 1, label: "I — < 1 mm horizontal" },
  { value: 2, label: "II — > 1 mm horizontal" },
  { value: 3, label: "III — vertical / depressible" },
];

export const FURCATION_GRADES = [
  { value: 0, label: "0 — none" },
  { value: 1, label: "I — incipient" },
  { value: 2, label: "II — partial" },
  { value: 3, label: "III — through and through" },
];

/** AAP / EFP 2018 staging, abbreviated to what the chart needs. */
export const PERIO_STAGES = [
  { value: "I", label: "Stage I", detail: "CAL 1–2 mm · early", tone: "success" },
  { value: "II", label: "Stage II", detail: "CAL 3–4 mm · moderate", tone: "info" },
  { value: "III", label: "Stage III", detail: "CAL ≥ 5 mm · severe, potential tooth loss", tone: "warning" },
  { value: "IV", label: "Stage IV", detail: "CAL ≥ 5 mm · advanced, masticatory dysfunction", tone: "danger" },
];

export const PERIO_GRADES = [
  { value: "A", label: "Grade A", detail: "Slow progression" },
  { value: "B", label: "Grade B", detail: "Moderate progression" },
  { value: "C", label: "Grade C", detail: "Rapid progression" },
];

/** Very abbreviated staging heuristic used to suggest a value in the UI. */
export function suggestPerioStage({ maxCal = 0, boneLossPercent = 0 }) {
  if (maxCal >= 5 && boneLossPercent > 33) return "IV";
  if (maxCal >= 5) return "III";
  if (maxCal >= 3) return "II";
  if (maxCal >= 1) return "I";
  return null;
}

/* --------------------------------------------------------- medical history */

/** ASA physical status — governs whether treatment can proceed in-chair. */
export const ASA_CLASSES = [
  { value: "I", label: "ASA I", detail: "Healthy patient", tone: "success" },
  { value: "II", label: "ASA II", detail: "Mild systemic disease", tone: "info" },
  { value: "III", label: "ASA III", detail: "Severe systemic disease", tone: "warning" },
  { value: "IV", label: "ASA IV", detail: "Severe disease, constant threat to life", tone: "danger" },
  { value: "V", label: "ASA V", detail: "Moribund", tone: "danger" },
];

export const MEDICAL_ALERTS = [
  { value: "anticoagulant", label: "On anticoagulants", tone: "danger" },
  { value: "bisphosphonate", label: "Bisphosphonate therapy", tone: "danger" },
  { value: "endocarditis", label: "Endocarditis prophylaxis required", tone: "danger" },
  { value: "diabetes", label: "Diabetes", tone: "warning" },
  { value: "hypertension", label: "Hypertension", tone: "warning" },
  { value: "pregnancy", label: "Pregnant", tone: "warning" },
  { value: "latex", label: "Latex allergy", tone: "danger" },
  { value: "penicillin", label: "Penicillin allergy", tone: "danger" },
  { value: "immunosuppressed", label: "Immunosuppressed", tone: "warning" },
];

export const alertMeta = (value) =>
  MEDICAL_ALERTS.find((item) => item.value === value) ?? { value, label: value, tone: "neutral" };

/* ------------------------------------------------------------ radiographs */

export const RADIOGRAPH_TYPES = [
  { value: "PA", label: "Periapical", dose: "0.005 mSv" },
  { value: "BW", label: "Bitewing", dose: "0.005 mSv" },
  { value: "PAN", label: "Panoramic", dose: "0.01 mSv" },
  { value: "CEPH", label: "Cephalometric", dose: "0.006 mSv" },
  { value: "CBCT", label: "CBCT", dose: "0.05–0.1 mSv" },
];

/* -------------------------------------------------------------- recalls */

export const RECALL_INTERVALS = [
  { value: 3, label: "3 months", detail: "High caries or perio risk" },
  { value: 6, label: "6 months", detail: "Standard interval" },
  { value: 9, label: "9 months", detail: "Low risk, stable" },
  { value: 12, label: "12 months", detail: "Low risk, excellent hygiene" },
];

/** Simplified CAMBRA-style caries risk. */
export const CARIES_RISK = [
  { value: "low", label: "Low", tone: "success", recall: 12 },
  { value: "moderate", label: "Moderate", tone: "info", recall: 6 },
  { value: "high", label: "High", tone: "warning", recall: 3 },
  { value: "extreme", label: "Extreme", tone: "danger", recall: 3 },
];

/* ---------------------------------------------------------- prescribing */

export const PRESCRIPTION_FORMULARY = [
  { name: "Amoxicillin", strengths: ["250 mg", "500 mg"], defaultSig: "1 capsule three times daily", days: 5, class: "Antibiotic" },
  { name: "Amoxicillin + Clavulanate", strengths: ["625 mg"], defaultSig: "1 tablet twice daily", days: 5, class: "Antibiotic" },
  { name: "Metronidazole", strengths: ["200 mg", "400 mg"], defaultSig: "1 tablet three times daily", days: 5, class: "Antibiotic" },
  { name: "Clindamycin", strengths: ["150 mg", "300 mg"], defaultSig: "1 capsule four times daily", days: 5, class: "Antibiotic" },
  { name: "Ibuprofen", strengths: ["200 mg", "400 mg", "600 mg"], defaultSig: "1 tablet every 6 hours as needed", days: 3, class: "Analgesic" },
  { name: "Paracetamol", strengths: ["500 mg", "1 g"], defaultSig: "1 tablet every 6 hours as needed", days: 3, class: "Analgesic" },
  { name: "Mefenamic acid", strengths: ["500 mg"], defaultSig: "1 tablet three times daily after food", days: 3, class: "Analgesic" },
  { name: "Chlorhexidine 0.2% rinse", strengths: ["300 ml"], defaultSig: "Rinse 10 ml twice daily for 1 minute", days: 14, class: "Antiseptic" },
  { name: "Sodium fluoride 5000 ppm", strengths: ["1.1%"], defaultSig: "Brush nightly, do not rinse", days: 90, class: "Preventive" },
];

/* ------------------------------------------------------------ lab cases */

export const LAB_CASE_TYPES = [
  "Crown",
  "Bridge",
  "Veneer",
  "Inlay / Onlay",
  "Complete denture",
  "Partial denture",
  "Implant abutment",
  "Night guard",
  "Orthodontic retainer",
];

export const SHADE_GUIDE = [
  "A1", "A2", "A3", "A3.5", "A4",
  "B1", "B2", "B3", "B4",
  "C1", "C2", "C3", "C4",
  "D2", "D3", "D4",
];

export const LAB_CASE_STAGES = [
  { value: "impression", label: "Impression taken", tone: "neutral" },
  { value: "sent", label: "Sent to lab", tone: "info" },
  { value: "in_production", label: "In production", tone: "warning" },
  { value: "try_in", label: "Try-in", tone: "brand" },
  { value: "returned", label: "Returned to clinic", tone: "success" },
  { value: "fitted", label: "Fitted", tone: "success" },
  { value: "remake", label: "Remake required", tone: "danger" },
];

/* ------------------------------------------------------- infection control */

export const STERILIZER_CYCLE_TYPES = [
  { value: "B", label: "Class B — vacuum", detail: "Hollow, porous and wrapped loads" },
  { value: "S", label: "Class S — manufacturer specified", detail: "Selected load types" },
  { value: "N", label: "Class N — non-vacuum", detail: "Solid unwrapped instruments only" },
];

export const CYCLE_RESULTS = [
  { value: "pass", label: "Pass", tone: "success" },
  { value: "fail", label: "Fail", tone: "danger" },
  { value: "pending", label: "Awaiting result", tone: "warning" },
];

/** Biological (spore) testing cadence most regulators expect. */
export const SPORE_TEST_INTERVAL_DAYS = 7;
