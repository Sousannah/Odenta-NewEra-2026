import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const getPatients = (params) => api.get(endpoints.patients.list, params);
export const getPatient = (id) => api.get(endpoints.patients.detail(id));
export const createPatient = (body) => api.post(endpoints.patients.list, body);
export const updatePatient = (id, body) => api.patch(endpoints.patients.detail(id), body);

export const getPatientAppointments = (id) => api.get(endpoints.patients.appointments(id));
export const getPatientAttachments = (id) => api.get(endpoints.patients.attachments(id));
export const getPatientPlans = (id) => api.get(endpoints.patients.plans(id));
export const getPatientPrescriptions = (id) => api.get(endpoints.patients.prescriptions(id));

export const getRecalls = (params) => api.get(endpoints.recalls.list, params);

/**
 * Is this phone number or patient number free?
 *
 * A point read against a uniqueness reservation, cheap enough to call as the
 * desk types. Answers `{ available, patientId }` — never a name, because
 * telling whoever typed a number whose it is would be a disclosure.
 */
export const checkIdentifier = (params) => api.get(endpoints.patients.availability, params);

/* ------------------------------------------------------------- recalls */

export const getRecallCounts = () => api.get(endpoints.recalls.counts);

export const scheduleRecall = (body) => api.post(endpoints.recalls.list, body);

/**
 * Log that the patient was contacted about their recall.
 *
 * Deliberately does not take them off the list — being rung is not being seen,
 * and a patient who drops off the queue because somebody phoned once is a
 * patient nobody ever calls again. `declined` is the one outcome that does,
 * because continuing to ring somebody who has said no is what a recall system
 * gets complained about for.
 */
export const logRecallContact = (id, { outcome = "called", note } = {}) =>
  api.post(endpoints.recalls.contact(id), { outcome, note });

/** The patient booked — marked rather than deleted, so conversion is countable. */
export const markRecallBooked = (id, visitId) =>
  api.post(endpoints.recalls.booked(id), { visitId });
