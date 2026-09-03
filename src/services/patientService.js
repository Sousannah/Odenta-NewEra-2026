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
