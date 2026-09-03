import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const getAppointments = (params) => api.get(endpoints.appointments.list, params);
export const getAppointment = (id) => api.get(endpoints.appointments.detail(id));
export const createAppointment = (body) => api.post(endpoints.appointments.list, body);
export const updateAppointment = (id, body) => api.patch(endpoints.appointments.detail(id), body);

export const setAppointmentStatus = (id, status) =>
  api.patch(endpoints.appointments.detail(id), { status });

/** Front-desk check-in stamps the arrival time alongside the status change. */
export const checkIn = (id) =>
  api.patch(endpoints.appointments.detail(id), {
    status: "arrived",
    checkedInAt: new Date().toTimeString().slice(0, 5),
  });

export const getAppointmentLog = () => api.get(endpoints.appointments.log);
export const getWaitlist = () => api.get(endpoints.appointments.waitlist);
export const getRooms = () => api.get(endpoints.rooms.list);
