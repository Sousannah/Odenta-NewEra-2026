import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const getLabCases = (params) => api.get(endpoints.lab.cases, params);
export const updateLabCase = (id, body) => api.patch(endpoints.lab.caseDetail(id), body);
export const advanceLabCase = (id, stage) => api.patch(endpoints.lab.caseDetail(id), { stage });
