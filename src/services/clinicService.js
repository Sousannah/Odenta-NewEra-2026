import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const getClinic = () => api.get(endpoints.clinic.current);
export const getBranches = () => api.get(endpoints.clinic.branches);

export const getStaff = (params) => api.get(endpoints.staff.list, params);
export const getDentists = () => api.get(endpoints.staff.dentists);
export const getStaffMember = (id) => api.get(endpoints.staff.detail(id));

export const getTreatments = (params) => api.get(endpoints.treatments.list, params);
export const getTreatment = (id) => api.get(endpoints.treatments.detail(id));

export const getSupportThreads = () => api.get(endpoints.support.threads);
export const getHelpArticles = (params) => api.get(endpoints.support.articles, params);

export const getAuditLog = (params) => api.get(endpoints.audit.list, params);
