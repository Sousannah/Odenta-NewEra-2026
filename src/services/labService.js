import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const getLabCases = (params) => api.get(endpoints.lab.cases, params);
export const updateLabCase = (id, body) => api.patch(endpoints.lab.caseDetail(id), body);
export const advanceLabCase = (id, stage) => api.patch(endpoints.lab.caseDetail(id), { stage });

/** How many cases sit in each stage — one grouped count, four badges. */
export const getLabStageCounts = () => api.get(endpoints.lab.stages);

/**
 * The dentist writes the work order.
 *
 * Shade, material, teeth and a due date. The case starts as `prescribed` — it
 * exists and nothing has physically left the practice yet, which is the gap the
 * assistant closes.
 */
export const prescribeLabCase = (body) => api.post(endpoints.lab.cases, body);

/**
 * The assistant sends the impression out.
 *
 * Its own call rather than a stage change with extra fields, because it records
 * *what* left the building and *when* — which is the thing a practice needs
 * when a lab says it never arrived.
 */
export const dispatchImpression = (id, body) => api.post(endpoints.lab.dispatch(id), body);

/**
 * The desk rings the patient about their work.
 *
 * Replaces the toast the Call button used to show. A count and a timestamp on
 * the case is the whole feature, and it is what stops two receptionists ringing
 * the same person an hour apart.
 */
export const logLabContact = (id, outcome = "called") =>
  api.post(endpoints.lab.contact(id), { outcome });
