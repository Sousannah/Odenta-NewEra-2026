import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

/**
 * Public-site verbs.
 *
 * Everything the marketing pages need, and nothing that requires a session.
 * When the backend lands these are the only endpoints that must be reachable
 * anonymously — the rest of the surface stays behind auth.
 */

export const getUniversities = (params) => api.get(endpoints.site.universities, params);
export const getUniversity = (id) => api.get(endpoints.site.university(id));
export const getPartnerClinics = () => api.get(endpoints.site.partnerClinics);
export const getTestimonials = () => api.get(endpoints.site.testimonials);

/** Contact form. `{ name, email, organisation?, topic?, message }` */
export const submitContactRequest = (payload) => api.post(endpoints.site.contact, payload);

/** "Book a demo" form. `{ name, email, organisation, role?, size?, notes? }` */
export const requestDemo = (payload) => api.post(endpoints.site.demoRequest, payload);

export const subscribeToNewsletter = (payload) => api.post(endpoints.site.newsletter, payload);

/**
 * Public AI demo.
 *
 * Today the payload is metadata about the chosen file; against the live API
 * this becomes a multipart upload and the response shape is unchanged —
 * `{ model, processingMs, findings: [{ tooth, condition, confidence, box }] }`.
 */
export const analyseRadiograph = (payload) => api.post(endpoints.site.aiAnalysis, payload);

/* --------------------------------------------------- public appointment booking */

/**
 * Slot availability for a campus on one day.
 *
 * Resolves `{ universityId, date, slots: [{ time, endTime, session, capacity,
 * remaining, available }] }`. Capacity is per hour, not per chair — the
 * teaching clinic screens several patients in the same slot.
 */
export const getBookingSlots = ({ universityId, date }) =>
  api.get(endpoints.site.bookingSlots, { universityId, date });

/**
 * Book a chair in a university clinic.
 *
 * `{ universityId, date, time, fullName, phone, nationalId, age?, gender?,
 * occupation?, address?, chiefComplaint? }`. Resolves with the booking,
 * including the `reference` the confirmation page and the clinic desk both
 * quote. Throws `slot_unavailable` (409) if the slot filled while the form
 * was open.
 */
export const bookAppointment = (payload) => api.post(endpoints.site.bookings, payload);

/** Look a booking back up from its reference — used by the confirmation page. */
export const getBooking = (reference) => api.get(endpoints.site.booking(reference));
