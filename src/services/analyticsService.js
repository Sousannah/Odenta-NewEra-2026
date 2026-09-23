import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

/**
 * Role-scoped dashboard payload; the server decides what a role may see.
 *
 * Still supported, and it still reaches the right board — the server resolves
 * the target from the session and **ignores the role in the path**, so this
 * cannot be used to ask for somebody else's. New code should call the role's
 * own service (`ownerService.getBoard`, and the equivalents) rather than this.
 */
export const getDashboard = (role) => api.get(endpoints.analytics.dashboard(role));

/**
 * The practice report.
 *
 * `clinical` is opt-in because it is the one part of the payload that costs
 * queries rather than a fold over counters: the caries mix and the recall tally
 * are properties of the roster as it stands, and no counter can answer them.
 * The screen asks for it only when the reader holds `report:clinical`, so a
 * finance-only reader never pays for a panel they will not be shown.
 */
export const getReport = ({ range = "90", clinical = false } = {}) =>
  api.get(endpoints.analytics.report, { range, clinical: clinical ? "1" : "0" });
