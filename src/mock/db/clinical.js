import { addDays, format, subMonths } from "date-fns";
import { PERIO_SITES } from "@/config/dentalStandards";

const iso = (date) => format(date, "yyyy-MM-dd");
const today = new Date();

/**
 * Dental charts, keyed by patient then by FDI tooth number.
 *
 *   status: "existing" | "planned" | "completed" | "condition"
 *   Each entry is one clinical fact about one tooth (optionally one surface).
 */
export const charts = {
  "PT-1001": [
    { id: "CH-1", tooth: 21, surfaces: ["M", "I"], condition: "restoration", status: "completed", code: "D2391", note: "Composite filling", date: iso(subMonths(today, 14)), dentistId: "DNT-01" },
    { id: "CH-2", tooth: 22, surfaces: ["D"], condition: "restoration", status: "completed", code: "D2391", note: "", date: iso(subMonths(today, 14)), dentistId: "DNT-01" },
    { id: "CH-3", tooth: 18, surfaces: ["O", "D"], condition: "caries", status: "planned", code: "D2392", icdas: 5, note: "Sick tooth, filling planned for repair", date: iso(subMonths(today, 1)), dentistId: "DNT-01" },
    { id: "CH-4", tooth: 34, surfaces: ["O"], condition: "caries", status: "planned", code: "D2740", icdas: 4, note: "Consider crown if cusp undermined", date: iso(subMonths(today, 1)), dentistId: "DNT-01" },
    { id: "CH-5", tooth: 46, surfaces: [], condition: "rct", status: "completed", code: "D3330", note: "Root filled 2023, asymptomatic", date: iso(subMonths(today, 30)), dentistId: "DNT-01" },
    { id: "CH-6", tooth: 38, surfaces: [], condition: "impacted", status: "condition", code: "D7240", note: "Mesioangular impaction, monitor", date: iso(subMonths(today, 6)), dentistId: "DNT-04" },
    { id: "CH-7", tooth: 26, surfaces: [], condition: "missing", status: "condition", code: null, note: "Extracted elsewhere 2019", date: iso(subMonths(today, 60)), dentistId: null },
  ],
  "PT-1007": [
    { id: "CH-10", tooth: 36, surfaces: [], condition: "pulpitis", status: "planned", code: "D3330", note: "Irreversible pulpitis, RCT visit 3 of 4", date: iso(subMonths(today, 2)), dentistId: "DNT-02" },
    { id: "CH-11", tooth: 37, surfaces: ["O"], condition: "caries", status: "planned", code: "D2391", icdas: 3, note: "", date: iso(subMonths(today, 2)), dentistId: "DNT-02" },
    { id: "CH-12", tooth: 16, surfaces: ["M", "O"], condition: "restoration", status: "completed", code: "D2392", note: "", date: iso(subMonths(today, 8)), dentistId: "DNT-02" },
  ],
  "PT-1013": [
    { id: "CH-20", tooth: 22, surfaces: ["M"], condition: "caries", status: "completed", code: "D2391", icdas: 4, note: "Advanced Decay", date: iso(subMonths(today, 4)), dentistId: "DNT-01" },
    { id: "CH-21", tooth: 22, surfaces: ["D"], condition: "caries", status: "planned", code: "D2391", icdas: 5, note: "Decay in pulp — reason: not enough time", date: iso(subMonths(today, 5)), dentistId: "DNT-01" },
    { id: "CH-22", tooth: 21, surfaces: [], condition: "attrition", status: "condition", code: null, note: "Incisal wear from bruxism", date: iso(subMonths(today, 5)), dentistId: "DNT-03" },
    { id: "CH-23", tooth: 18, surfaces: ["O"], condition: "caries", status: "planned", code: "D2391", icdas: 3, note: "", date: iso(subMonths(today, 1)), dentistId: "DNT-03" },
  ],
  "PT-1011": [
    { id: "CH-30", tooth: 11, surfaces: [], condition: "missing", status: "condition", code: null, note: "", date: iso(subMonths(today, 40)), dentistId: null },
    { id: "CH-31", tooth: 12, surfaces: [], condition: "missing", status: "condition", code: null, note: "", date: iso(subMonths(today, 40)), dentistId: null },
    { id: "CH-32", tooth: 13, surfaces: [], condition: "missing", status: "condition", code: null, note: "", date: iso(subMonths(today, 40)), dentistId: null },
    { id: "CH-33", tooth: 21, surfaces: [], condition: "missing", status: "condition", code: null, note: "", date: iso(subMonths(today, 40)), dentistId: null },
    { id: "CH-34", tooth: 46, surfaces: [], condition: "implant", status: "completed", code: "D6010", note: "Placed 2024, osseointegrated", date: iso(subMonths(today, 18)), dentistId: "DNT-04" },
  ],
};

/* ----------------------------------------------------------- perio charts */

/** Builds a plausible six-point chart so the perio screen has real numbers. */
function buildPerio(seed = 1, teeth = []) {
  const chart = {};
  teeth.forEach((tooth, index) => {
    const base = 2 + ((index * seed) % 3);
    const pd = {};
    const rec = {};
    PERIO_SITES.forEach((site, siteIndex) => {
      const bump = (index + siteIndex + seed) % 5 === 0 ? 3 : 0;
      pd[site] = String(Math.min(base + bump, 9));
      rec[site] = bump ? String(Math.min(bump - 1, 3)) : "0";
    });
    chart[tooth] = {
      pd,
      rec,
      bleeding: (index * seed) % 4 === 0,
      mobility: (index * seed) % 7 === 0 ? "1" : "0",
    };
  });
  return chart;
}

const PERIO_TEETH = [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46];

export const perioCharts = {
  "PT-1001": {
    recordedAt: iso(subMonths(today, 2)),
    recordedBy: "DNT-01",
    stage: "II",
    grade: "B",
    data: buildPerio(1, PERIO_TEETH),
  },
  "PT-1011": {
    recordedAt: iso(subMonths(today, 1)),
    recordedBy: "DNT-04",
    stage: "III",
    grade: "C",
    data: buildPerio(3, PERIO_TEETH),
  },
  "PT-1009": {
    recordedAt: iso(subMonths(today, 4)),
    recordedBy: "DNT-04",
    stage: "III",
    grade: "B",
    data: buildPerio(2, PERIO_TEETH),
  },
};

/* --------------------------------------------------------- treatment plans */

export const treatmentPlans = [
  {
    id: "PLAN-01",
    patientId: "PT-1001",
    treatmentId: "TRT-03",
    treatment: "Tooth Filling",
    type: "MULTIPLE",
    status: "in_progress",
    dentistId: "DNT-01",
    teeth: [18, 34],
    totalVisits: 2,
    completedVisits: 1,
    estimatedCost: 440,
    consentSigned: true,
    createdAt: iso(subMonths(today, 1)),
    visits: [
      { visit: 1, title: "Restoration 18", date: iso(addDays(today, -14)), appointmentId: "RSVA0890", time: "11:00 am - 12:00 pm", dentist: "drg. Soap Mactavish, MM, SpKGA", state: "done" },
      { visit: 2, title: "Restoration 34", date: iso(addDays(today, 0)), appointmentId: "RSVA1009", time: "02:00 pm - 03:00 pm", dentist: "drg. Putri Larasati, SpOrt", state: "upcoming" },
    ],
  },
  {
    id: "PLAN-02",
    patientId: "PT-1007",
    treatmentId: "TRT-05",
    treatment: "Root Canal Treatment",
    type: "MULTIPLE",
    status: "in_progress",
    dentistId: "DNT-02",
    teeth: [36],
    totalVisits: 4,
    completedVisits: 3,
    estimatedCost: 900,
    consentSigned: true,
    createdAt: iso(subMonths(today, 2)),
    visits: [
      { visit: 4, title: "Coronal restoration", date: iso(addDays(today, 1)), appointmentId: "RSVA1102", time: "11:00 am - 12:00 pm", dentist: "drg. Jerald O'Hara, SpKG", state: "upcoming" },
      { visit: 3, title: "Obturation", date: iso(today), appointmentId: "RSVA1007", time: "03:00 pm - 04:30 pm", dentist: "drg. Jerald O'Hara, SpKG", state: "done" },
      { visit: 2, title: "Working length & shaping", date: iso(addDays(today, -7)), appointmentId: "RSVA0810", time: "03:00 pm - 04:30 pm", dentist: "drg. Jerald O'Hara, SpKG", state: "done" },
      { visit: 1, title: "Access & extirpation", date: iso(addDays(today, -14)), appointmentId: "RSVA0790", time: "03:00 pm - 04:30 pm", dentist: "drg. Jerald O'Hara, SpKG", state: "done" },
    ],
  },
  {
    id: "PLAN-03",
    patientId: "PT-1013",
    treatmentId: "TRT-06",
    treatment: "Tooth Braces (Metal)",
    type: "MULTIPLE",
    status: "proposed",
    dentistId: "DNT-03",
    teeth: [],
    totalVisits: 4,
    completedVisits: 0,
    estimatedCost: 3000,
    consentSigned: false,
    createdAt: iso(addDays(today, -1)),
    visits: [
      { visit: 1, title: "Oral Hygiene", date: iso(addDays(today, 2)), appointmentId: "RSVA1103", time: "03:00 pm - 04:00 pm", dentist: "drg. Putri Larasati, SpOrt", state: "upcoming" },
      { visit: 2, title: "Scaling", date: iso(addDays(today, 9)), appointmentId: null, time: "—", dentist: "drg. Putri Larasati, SpOrt", state: "planned" },
      { visit: 3, title: "Braces Application", date: iso(addDays(today, 16)), appointmentId: null, time: "—", dentist: "drg. Putri Larasati, SpOrt", state: "planned" },
      { visit: 4, title: "Bracket Review", date: iso(addDays(today, 44)), appointmentId: null, time: "—", dentist: "drg. Putri Larasati, SpOrt", state: "planned" },
    ],
  },
  {
    id: "PLAN-04",
    patientId: "PT-1011",
    treatmentId: "TRT-09",
    treatment: "Complete Denture",
    type: "MULTIPLE",
    status: "in_progress",
    dentistId: "DNT-04",
    teeth: [],
    totalVisits: 5,
    completedVisits: 2,
    estimatedCost: 1650,
    consentSigned: true,
    createdAt: iso(subMonths(today, 1)),
    visits: [
      { visit: 3, title: "Jaw relation", date: iso(today), appointmentId: "RSVA1012", time: "01:00 pm - 02:00 pm", dentist: "drg. Amara Voss, SpPM", state: "upcoming" },
      { visit: 2, title: "Secondary impression", date: iso(addDays(today, -7)), appointmentId: null, time: "01:00 pm - 02:00 pm", dentist: "drg. Amara Voss, SpPM", state: "done" },
      { visit: 1, title: "Primary impression", date: iso(addDays(today, -14)), appointmentId: null, time: "01:00 pm - 02:00 pm", dentist: "drg. Amara Voss, SpPM", state: "done" },
    ],
  },
];

/* ------------------------------------------------------------- clinical notes */

export const clinicalNotes = [
  {
    id: "NOTE-01",
    patientId: "PT-1001",
    appointmentId: "RSVA0890",
    date: iso(addDays(today, -14)),
    dentistId: "DNT-01",
    subjective: "Sensitivity to cold on upper right, 2 weeks.",
    objective: "Tooth 18 OD cavitation, ICDAS 5. Cold test exaggerated, settles < 10 s. No TTP.",
    assessment: "Reversible pulpitis 18 secondary to caries (K02.9).",
    plan: "Composite restoration 18 OD (D2392). Review 34 next visit.",
    anaesthetic: "Articaine 4% with 1:100,000 adrenaline, 1.7 ml buccal infiltration.",
  },
  {
    id: "NOTE-02",
    patientId: "PT-1007",
    appointmentId: "RSVA1007",
    date: iso(today),
    dentistId: "DNT-02",
    subjective: "No pain since last visit.",
    objective: "36 asymptomatic, dressing intact. Canals dry.",
    assessment: "Ready for obturation.",
    plan: "Obturate with gutta percha and AH Plus. Core buildup next visit.",
    anaesthetic: "None required.",
  },
];

/* --------------------------------------------------------- prescriptions */

export const prescriptions = [
  {
    id: "RX-1001",
    patientId: "PT-1005",
    dentistId: "DNT-01",
    appointmentId: "RSVA1003",
    issuedAt: iso(today),
    status: "active",
    items: [
      { drug: "Amoxicillin", strength: "500 mg", sig: "1 capsule three times daily", quantity: 15, days: 5 },
      { drug: "Mefenamic acid", strength: "500 mg", sig: "1 tablet three times daily after food", quantity: 9, days: 3 },
    ],
    notes: "Complete the full antibiotic course.",
  },
  {
    id: "RX-1002",
    patientId: "PT-1011",
    dentistId: "DNT-04",
    appointmentId: "RSVA1012",
    issuedAt: iso(addDays(today, -7)),
    status: "active",
    items: [
      { drug: "Amoxicillin", strength: "500 mg", sig: "4 capsules 1 hour before appointment", quantity: 4, days: 1 },
    ],
    notes: "Endocarditis prophylaxis — single pre-operative dose.",
  },
  {
    id: "RX-1003",
    patientId: "PT-1001",
    dentistId: "DNT-01",
    appointmentId: null,
    issuedAt: iso(subMonths(today, 1)),
    status: "completed",
    items: [
      { drug: "Sodium fluoride 5000 ppm", strength: "1.1%", sig: "Brush nightly, do not rinse", quantity: 1, days: 90 },
    ],
    notes: "High caries risk regimen.",
  },
];

/* ------------------------------------------------------------- attachments */

export const attachments = [
  { id: "ATT-01", patientId: "PT-1005", appointmentId: "RSVA1003", name: "toothcavities.jpg", size: "1.2 MB", type: "image", kind: "Clinical photo", note: "", uploadedAt: iso(today) },
  { id: "ATT-02", patientId: "PT-1005", appointmentId: "RSVA1003", name: "tooth2134.jpg", size: "980 KB", type: "image", kind: "Clinical photo", note: "Patient tooth shape", uploadedAt: iso(today) },
  { id: "ATT-03", patientId: "PT-1005", appointmentId: "RSVA1003", name: "toothcavities2.jpg", size: "1.6 MB", type: "image", kind: "Clinical photo", note: "", uploadedAt: iso(today) },
  { id: "ATT-04", patientId: "PT-1001", appointmentId: null, name: "PAN_2026_03.jpg", size: "3.1 MB", type: "image", kind: "PAN", note: "Panoramic, March 2026", uploadedAt: iso(subMonths(today, 6)) },
  { id: "ATT-05", patientId: "PT-1001", appointmentId: null, name: "Consent_Restorative.pdf", size: "240 KB", type: "pdf", kind: "Consent", note: "Signed restorative consent", uploadedAt: iso(subMonths(today, 1)) },
  { id: "ATT-06", patientId: "PT-1007", appointmentId: "RSVA1007", name: "PA_36_working_length.jpg", size: "820 KB", type: "image", kind: "PA", note: "Working length radiograph", uploadedAt: iso(addDays(today, -7)) },
  { id: "ATT-07", patientId: "PT-1013", appointmentId: null, name: "Med_Pic_2134.jpg", size: "1.1 MB", type: "image", kind: "Clinical photo", note: "", uploadedAt: iso(subMonths(today, 4)) },
];

/* ------------------------------------------------------- oral hygiene survey */

export const hygieneSurveys = {
  "PT-1013": {
    updatedAt: iso(subMonths(today, 2)),
    answers: {
      "last-visit": "Less than 3 months ago",
      "care-start": "About 20 years old",
      brushing: "Twice",
      mouthwash: "Yes",
      floss: "Daily",
      toothbrush: "Every 3 months",
    },
  },
  "PT-1001": {
    updatedAt: iso(subMonths(today, 1)),
    answers: {
      "last-visit": "Less than 3 months ago",
      "care-start": "Teenager",
      brushing: "Once",
      mouthwash: "Never",
      floss: "Never",
      toothbrush: "Every 6 months",
    },
  },
};
