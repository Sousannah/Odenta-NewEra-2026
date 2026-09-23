import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const getAppointments = (params) => api.get(endpoints.appointments.list, params);
export const getAppointment = (id) => api.get(endpoints.appointments.detail(id));
export const createAppointment = (body) => api.post(endpoints.appointments.list, body);
export const updateAppointment = (id, body) => api.patch(endpoints.appointments.detail(id), body);

export const setAppointmentStatus = (id, status) =>
  api.patch(endpoints.appointments.detail(id), { status });

/**
 * Front-desk check-in.
 *
 * The arrival time is stamped by the **server**, not here. This used to send
 * `new Date().toTimeString()`, and a reception PC whose clock is eleven minutes
 * fast would write an arrival eleven minutes before the patient arrived — into
 * the record a practice uses to argue about waiting times. The server accepts
 * the field and ignores it; passing it at all is left out so nobody reads this
 * and assumes it is honoured.
 *
 * `currentDate` is the visit's date, which is part of its address: the book is
 * partitioned by month, so a point read needs to know which month. Every caller
 * holds the row it is acting on, so every caller can send it.
 */
export const checkIn = (id, currentDate) =>
  api.patch(endpoints.appointments.detail(id), { status: "arrived" }, { params: { currentDate } });

export const getAppointmentLog = () => api.get(endpoints.appointments.log);
export const getWaitlist = () => api.get(endpoints.appointments.waitlist);
export const getRooms = () => api.get(endpoints.rooms.list);

/** Somebody waiting on a cancellation. */
export const addToWaitlist = (body) => api.post(endpoints.appointments.waitlist, body);

/**
 * Take somebody off the waitlist.
 *
 * Marked rather than deleted — "we offered her the 3pm and she turned it down"
 * is the answer to "why is this person still waiting" three weeks later.
 */
export const resolveWaitlistEntry = (id, body) =>
  api.patch(endpoints.appointments.waitlistEntry(id), body);

/* ------------------------------------------------------------ front desk */

/**
 * The whole front-desk board, in one request.
 *
 * Replaces six: today's appointments, the waitlist, every recall on file,
 * every bill ever issued, every lab case ever, and a canned analytics
 * aggregate. Three of those were unbounded tables read in full so the browser
 * could call `.filter().length` on them — by every machine at the front of the
 * clinic, on every window focus.
 *
 * Returns `{ kpis, hourlyArrivals, expected, waitlist, recalls, lab, bills,
 * totals }`, each list already bounded and sorted the way its card renders.
 * `totals` carries the real counts beside the bounded lists, so a card heading
 * can say "12 open bill(s)" while showing eight.
 */
export const getFrontDeskBoard = (date) => api.get(endpoints.frontDesk.board, { date });
