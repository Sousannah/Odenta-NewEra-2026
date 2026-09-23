/**
 * The teaching clinic's vocabulary.
 *
 * `config/domain.js` describes a private practice; this file describes a dental
 * school. Where the two overlap (an appointment still moves through the same
 * visit flow) the constant is imported from there rather than duplicated.
 */

/* ------------------------------------------------------------ departments */

/**
 * A clinical rotation. `key` is what the API stores; `sheet` names the
 * treatment sheet a case in that department is charted on.
 */
export const DEPARTMENTS = [
  { key: "operative", label: "Operative Dentistry", short: "Operative", sheet: "operative", tone: "brand" },
  { key: "endodontics", label: "Endodontics", short: "Endo", sheet: "endodontics", tone: "danger" },
  { key: "prosthodontics_fixed", label: "Fixed Prosthodontics", short: "Fixed Pros", sheet: "fixed_prosthodontics", tone: "info" },
  { key: "prosthodontics_removable", label: "Removable Prosthodontics", short: "Removable Pros", sheet: "removable_prosthodontics", tone: "success" },
  { key: "periodontics", label: "Periodontics", short: "Perio", sheet: "periodontics", tone: "warning" },
  { key: "oral_surgery", label: "Oral Surgery", short: "Surgery", sheet: "oral_surgery", tone: "neutral" },
];

export const departmentMeta = (key) =>
  DEPARTMENTS.find((item) => item.key === key) ?? { key, label: key, short: key, tone: "neutral" };

/* --------------------------------------------------------- treatment sheets */

/**
 * The five sheets a student fills in chairside. Each is a fixed set of
 * sections; the backend stores `{ type, caseId, sections: { [key]: value } }`.
 */
export const SHEET_TYPES = [
  {
    value: "operative",
    label: "Operative",
    department: "operative",
    sections: [
      { key: "diagnosis", label: "Diagnosis", fields: ["Tooth", "Surfaces", "Caries class", "Pulp status"] },
      { key: "isolation", label: "Isolation", fields: ["Rubber dam", "Matrix", "Wedge"] },
      { key: "preparation", label: "Cavity preparation", fields: ["Design", "Depth", "Bevel", "Liner / base"] },
      { key: "restoration", label: "Restoration", fields: ["Material", "Shade", "Increments", "Cure time"] },
      { key: "finishing", label: "Finishing & polishing", fields: ["Occlusion checked", "Contact verified", "Polish"] },
    ],
  },
  {
    value: "endodontics",
    label: "Endodontics",
    department: "endodontics",
    sections: [
      { key: "diagnosis", label: "Pulpal & periapical diagnosis", fields: ["Tooth", "Pulpal Dx", "Periapical Dx", "Vitality test"] },
      { key: "access", label: "Access cavity", fields: ["Anaesthesia", "Rubber dam", "Access outline", "Canals located"] },
      { key: "working_length", label: "Working length", fields: ["Reference cusp", "Apex locator", "Radiographic WL", "Master file"] },
      { key: "instrumentation", label: "Instrumentation", fields: ["System", "Master apical file", "Irrigant", "Patency"] },
      { key: "obturation", label: "Obturation", fields: ["Technique", "Sealer", "Cone fit radiograph", "Post-op radiograph"] },
    ],
  },
  {
    value: "fixed_prosthodontics",
    label: "Fixed Prosthodontics",
    department: "prosthodontics_fixed",
    sections: [
      { key: "case_plan", label: "Case plan", fields: ["Abutments", "Pontics", "Design", "Material"] },
      { key: "preparation", label: "Preparation", fields: ["Finish line", "Reduction", "Taper", "Retraction"] },
      { key: "impression", label: "Impression", fields: ["Technique", "Material", "Bite registration", "Shade"] },
      { key: "provisional", label: "Provisional", fields: ["Type", "Cement", "Occlusion", "Margins"] },
      { key: "cementation", label: "Try-in & cementation", fields: ["Fit", "Contacts", "Occlusion", "Cement"] },
    ],
  },
  {
    value: "removable_prosthodontics",
    label: "Removable Prosthodontics",
    department: "prosthodontics_removable",
    sections: [
      { key: "classification", label: "Classification", fields: ["Kennedy class", "Modification", "Arch", "Opposing arch"] },
      { key: "primary", label: "Primary impression", fields: ["Tray", "Material", "Border extension"] },
      { key: "secondary", label: "Secondary impression", fields: ["Special tray", "Border moulding", "Wash material"] },
      { key: "jaw_relation", label: "Jaw relation", fields: ["Occlusal rims", "VD rest", "VD occlusion", "Centric record"] },
      { key: "insertion", label: "Try-in & insertion", fields: ["Aesthetics", "Phonetics", "Occlusion", "Post-insertion advice"] },
    ],
  },
  {
    value: "periodontics",
    label: "Periodontics",
    department: "periodontics",
    sections: [
      { key: "assessment", label: "Assessment", fields: ["Plaque index", "Bleeding index", "Calculus", "Mobility"] },
      { key: "charting", label: "Perio charting", fields: ["Pocket depths", "Recession", "Furcation", "CAL"] },
      { key: "diagnosis", label: "Diagnosis", fields: ["Stage", "Grade", "Extent", "Risk"] },
      { key: "phase_one", label: "Phase I therapy", fields: ["Scaling quadrants", "Root planing", "Oral hygiene instruction"] },
      { key: "reevaluation", label: "Re-evaluation", fields: ["Date", "Pocket change", "Bleeding change", "Next phase"] },
    ],
  },
  {
    value: "oral_surgery",
    label: "Oral Surgery",
    department: "oral_surgery",
    sections: [
      { key: "assessment", label: "Assessment", fields: ["Tooth", "Indication", "Radiograph", "Medical clearance"] },
      { key: "anaesthesia", label: "Anaesthesia", fields: ["Technique", "Agent", "Cartridges", "Onset"] },
      { key: "procedure", label: "Procedure", fields: ["Flap", "Bone removal", "Sectioning", "Delivery"] },
      { key: "closure", label: "Closure", fields: ["Irrigation", "Sutures", "Haemostasis"] },
      { key: "post_op", label: "Post-operative", fields: ["Instructions", "Analgesia", "Antibiotic", "Review date"] },
    ],
  },
];

export const sheetMeta = (value) => SHEET_TYPES.find((item) => item.value === value) ?? null;

/* ---------------------------------------------------------- the review loop */

/**
 * A student submits a *step* — one stage of one procedure on one tooth — and a
 * supervisor accepts it, returns it for correction, or rejects it. Nothing in
 * the case advances until the previous step is `accepted`.
 */
export const REVIEW_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  ACCEPTED: "accepted",
  RETURNED: "returned",
  REJECTED: "rejected",
};

export const REVIEW_STATUSES = [
  { value: REVIEW_STATUS.DRAFT, label: "Draft", tone: "neutral" },
  { value: REVIEW_STATUS.PENDING, label: "Awaiting review", tone: "warning" },
  { value: REVIEW_STATUS.ACCEPTED, label: "Accepted", tone: "success" },
  { value: REVIEW_STATUS.RETURNED, label: "Returned for correction", tone: "info" },
  { value: REVIEW_STATUS.REJECTED, label: "Rejected", tone: "danger" },
];

export const reviewStatusMeta = (value) =>
  REVIEW_STATUSES.find((item) => item.value === value) ?? { value, label: value, tone: "neutral" };

/** Grade bands a supervisor picks from when accepting a step. */
export const GRADES = [
  { value: "A", label: "A — Excellent", min: 85, tone: "success" },
  { value: "B", label: "B — Good", min: 75, tone: "brand" },
  { value: "C", label: "C — Satisfactory", min: 65, tone: "info" },
  { value: "D", label: "D — Borderline", min: 50, tone: "warning" },
  { value: "F", label: "F — Unsatisfactory", min: 0, tone: "danger" },
];

export const gradeFor = (score) =>
  GRADES.find((band) => Number(score) >= band.min) ?? GRADES[GRADES.length - 1];

/* -------------------------------------------------------------- lab & cases */

export const LAB_REQUEST_STATUSES = [
  { value: "pending", label: "Pending approval", tone: "warning" },
  { value: "approved", label: "Approved", tone: "brand" },
  { value: "in_production", label: "In production", tone: "info" },
  { value: "ready", label: "Ready for collection", tone: "success" },
  { value: "delivered", label: "Delivered", tone: "success" },
  { value: "rejected", label: "Rejected", tone: "danger" },
];

export const LAB_KINDS = [
  { value: "university", label: "University lab" },
  { value: "external", label: "External lab" },
];

export const PROCEDURE_REQUEST_STATUSES = [
  { value: "pending", label: "Pending", tone: "warning" },
  { value: "approved", label: "Approved", tone: "success" },
  { value: "declined", label: "Declined", tone: "danger" },
];

export const CASE_STATUSES = [
  { value: "unassigned", label: "Unassigned", tone: "neutral" },
  { value: "assigned", label: "Assigned", tone: "info" },
  { value: "in_treatment", label: "In treatment", tone: "brand" },
  { value: "awaiting_review", label: "Awaiting review", tone: "warning" },
  { value: "completed", label: "Completed", tone: "success" },
  { value: "discharged", label: "Discharged", tone: "neutral" },
];

export const caseStatusMeta = (value) =>
  CASE_STATUSES.find((item) => item.value === value) ?? { value, label: value, tone: "neutral" };

/* ------------------------------------------------------------- the academic */

export const ACADEMIC_YEARS = [
  { value: "year_3", label: "3rd year" },
  { value: "year_4", label: "4th year" },
  { value: "year_5", label: "5th year" },
  { value: "intern", label: "Internship" },
];

export const academicYearLabel = (value) =>
  ACADEMIC_YEARS.find((item) => item.value === value)?.label ?? value;

/**
 * Requirements are the quota a student must clear to pass a rotation. The
 * dashboard's progress rings and the supervisor's reports both read this.
 */
export const REQUIREMENT_UNIT = "case";

/** Clinic session slots — the teaching clinic runs two sessions a day. */
export const CLINIC_SESSIONS = [
  { value: "morning", label: "Morning session", start: "09:00", end: "12:00" },
  { value: "afternoon", label: "Afternoon session", start: "13:00", end: "16:00" },
];

/**
 * The half-hour slots inside one teaching session.
 *
 * Every screen that books or moves a visit offers the same list, so it lives
 * next to the sessions it is derived from rather than being re-derived by each
 * form that needs it.
 */
export const sessionSlots = (sessionValue) => {
  const session = CLINIC_SESSIONS.find((item) => item.value === sessionValue);
  if (!session) return [];
  const [startHour] = session.start.split(":").map(Number);
  const [endHour] = session.end.split(":").map(Number);
  const slots = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
};

/** Which session a "HH:mm" falls in. The clinic breaks for lunch at noon. */
export const sessionForTime = (time) =>
  (String(time) < "12:00" ? CLINIC_SESSIONS[0] : CLINIC_SESSIONS[1]) ?? CLINIC_SESSIONS[0];

/** Public booking slots offered on the marketing site. */
export const BOOKING_SLOT_MINUTES = 60;
