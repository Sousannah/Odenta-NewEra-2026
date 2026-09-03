import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

/** Role-scoped dashboard payload; the server decides what a role may see. */
export const getDashboard = (role) => api.get(endpoints.analytics.dashboard(role));

export const getReport = () => api.get(endpoints.analytics.report);
