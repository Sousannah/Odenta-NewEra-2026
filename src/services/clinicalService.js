import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const getClinicalRecord = (patientId) => api.get(endpoints.patients.clinical(patientId));

export const getChart = (patientId) => api.get(endpoints.patients.chart(patientId));
export const saveChart = (patientId, body) => api.put(endpoints.patients.chart(patientId), body);

export const getPerioChart = (patientId) => api.get(endpoints.patients.perio(patientId));
export const savePerioChart = (patientId, body) =>
  api.put(endpoints.patients.perio(patientId), body);

export const getPrescriptions = (patientId) => api.get(endpoints.patients.prescriptions(patientId));
export const createPrescription = (patientId, body) =>
  api.post(endpoints.patients.prescriptions(patientId), body);

export const getSterilizationCycles = () => api.get(endpoints.sterilization.cycles);
export const logSterilizationCycle = (body) => api.post(endpoints.sterilization.cycles, body);
