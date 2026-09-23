import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

/**
 * The clinical record — everything a dentist writes about a patient.
 *
 * Kept apart from `patientService`, which is the front desk's half
 * (demographics, contact, balance). The split mirrors the server's: a
 * receptionist holds `patient:view` and not `patient_clinical:view`, the two
 * halves live in different Cosmos containers, and nothing in this file is
 * reachable by the desk. Importing it from a desk screen would be the first
 * sign something has gone wrong.
 */

/**
 * The whole record in one request.
 *
 * Prefer this over the six granular reads below wherever a screen wants more
 * than one of them. Server-side the record is a single Cosmos partition keyed
 * by patient, so this is one query and one round trip where the granular calls
 * were six of each.
 *
 * `visits` bounds the visit history, which is the only unbounded part of a
 * record — pass 0 to skip it entirely when a screen does not show one.
 */
export const getPatientRecord = (patientId, { visits = 20 } = {}) =>
  api.get(endpoints.patients.record(patientId), { visits });

export const getClinicalRecord = (patientId) => api.get(endpoints.patients.clinical(patientId));

/* ------------------------------------------------------------------ chart */

export const getChart = (patientId) => api.get(endpoints.patients.chart(patientId));

/**
 * Save the chart.
 *
 * `version` is the etag the read handed back, echoed so the server can refuse a
 * save that would silently overwrite somebody else's. Two clinicians with the
 * same mouth open is ordinary in a two-chair practice — a dentist charts while
 * an assistant records what was used — and without it the second save discards
 * the first one's findings with no sign that anything happened.
 *
 * A `concurrent_update` error means exactly that; the screen should re-read and
 * tell the person rather than retrying.
 */
export const saveChart = (patientId, body, { version } = {}) =>
  api.put(endpoints.patients.chart(patientId), { ...body, version });

/* ------------------------------------------------------------------ perio */

export const getPerioChart = (patientId) => api.get(endpoints.patients.perio(patientId));

export const savePerioChart = (patientId, body, { version } = {}) =>
  api.put(endpoints.patients.perio(patientId), { ...body, version });

/* -------------------------------------------------------- medical history */

export const getMedicalHistory = (patientId) => api.get(endpoints.patients.medical(patientId));

/**
 * Merge-update: an omitted field means "not supplied", not "cleared".
 *
 * The history is edited from three places — the record screen, the chairside
 * alert strip and the prescription pad's allergy prompt — and a replace would
 * let the narrowest of those wipe the widest. Clearing a list is done by
 * sending an empty array.
 */
export const saveMedicalHistory = (patientId, changes) =>
  api.put(endpoints.patients.medical(patientId), changes);

/* ----------------------------------------------------------- prescriptions */

export const getPrescriptions = (patientId) => api.get(endpoints.patients.prescriptions(patientId));

/**
 * Write a prescription.
 *
 * The server refuses one that contradicts a recorded allergy — including the
 * cross-reactive case that matters, amoxicillin against a penicillin allergy —
 * with `code: "allergy_conflict"` and the conflicts in `error.details`. The
 * prescriber can proceed with `acknowledgeAllergy: true`, which is recorded on
 * the prescription and in the audit trail rather than silently allowed.
 */
export const createPrescription = (patientId, body) =>
  api.post(endpoints.patients.prescriptions(patientId), body);

/* --------------------------------------------------------- treatment plans */

export const getTreatmentPlans = (patientId) => api.get(endpoints.patients.plans(patientId));

export const createTreatmentPlan = (patientId, body) =>
  api.post(endpoints.patients.plans(patientId), body);

export const updateTreatmentPlan = (patientId, planId, body, { version } = {}) =>
  api.patch(endpoints.patients.plan(patientId, planId), { ...body, version });

/**
 * Record consent, which is also what starts the plan.
 *
 * One call rather than "set consent, then set status", because the server does
 * both in a single atomic patch — two round trips can leave a consented plan
 * sitting in `proposed` if the second one fails.
 */
export const recordPlanConsent = (patientId, planId, body) =>
  api.post(endpoints.patients.planConsent(patientId, planId), body);

/* ----------------------------------------------------------------- notes */

export const getClinicalNotes = (patientId) => api.get(endpoints.patients.notes(patientId));

/**
 * Write a SOAP note.
 *
 * Append-only by contract: there is no update and no delete, because a
 * contemporaneous note that can be edited afterwards is not contemporaneous.
 * An amendment is a new note.
 */
export const createClinicalNote = (patientId, body) =>
  api.post(endpoints.patients.notes(patientId), body);

/* ----------------------------------------------------------- attachments */

export const getAttachments = (patientId) => api.get(endpoints.patients.attachments(patientId));

/**
 * Upload a file to a patient's record, in the three steps the bytes require.
 *
 * The API never sees the file. It issues a capability scoped to one blob path
 * for ten minutes, the browser PUTs straight to Azure Blob Storage, and only
 * then does a descriptor get posted naming what was written — so a failed
 * upload leaves an orphaned blob the lifecycle rule sweeps, rather than a row
 * in the record pointing at a radiograph that is not there.
 *
 * `onProgress` is reported per step rather than per byte: `fetch` cannot report
 * upload progress without XHR, and a three-step indicator is honest about where
 * it is.
 */
export async function uploadAttachment(patientId, file, { kind = "Clinical photo", note = "", appointmentId = null, onProgress } = {}) {
  onProgress?.("requesting");
  const capability = await api.post(endpoints.patients.attachmentUpload(patientId), {
    contentType: file.type,
    sizeBytes: file.size,
    kind,
  });

  onProgress?.("uploading");

  /**
   * Straight to Azure, deliberately not through `api`.
   *
   * This leg is the one part of the flow that is *not* our API: the capability
   * URL is a short-lived SAS against Blob Storage, and the bytes never touch
   * us. Attaching our bearer token or CSRF header here would be sending our
   * credentials to a third party.
   */
  const response = await fetch(capability.url, {
    method: "PUT",
    /* Azure requires this header on a block blob PUT; the content type is also
       pinned into the signature, so a mismatch is refused by storage rather
       than accepted and served as something else later. */
    headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed (${response.status}). The link may have expired — try again.`);
  }

  onProgress?.("confirming");
  return api.post(endpoints.patients.attachments(patientId), {
    attachmentId: capability.attachmentId,
    blobPath: capability.blobPath,
    name: file.name,
    contentType: file.type,
    kind,
    note,
    appointmentId,
  });
}

export const deleteAttachment = (patientId, attachmentId) =>
  api.delete(endpoints.patients.attachment(patientId, attachmentId));

/* ---------------------------------------------------------- hygiene survey */

export const saveHygieneSurvey = (patientId, answers) =>
  api.put(endpoints.patients.hygiene(patientId), { answers });

/* ------------------------------------------------------------- the board */

/**
 * The dentist's dashboard, in one request.
 *
 * Returns the tiles, today's list, the open lab cases, the production series
 * and the case mix together — replacing a dashboard payload, a schedule query
 * and a fetch of *every lab case in the practice* that was then filtered in the
 * browser.
 */
export const getDentistBoard = (params) => api.get(endpoints.dentist.board, params);

/* ------------------------------------------------- infection control (read) */

/**
 * The sterilisation register.
 *
 * A dentist holds `sterilization:view` and not `sterilization:log` — they read
 * the cycle their tray came out of and do not keep the register. The write
 * lives on the assistant's surface.
 */
export const getSterilizationCycles = () => api.get(endpoints.sterilization.cycles);

export const logSterilizationCycle = (body) => api.post(endpoints.sterilization.cycles, body);
