/**
 * Domain services — the only layer that knows about HTTP.
 *
 * Screens import from here and never from `@/api` or `@/mock`. Each function's
 * name and return shape is the contract; swapping the driver in
 * `src/api/client.js` (or replacing a body with a different call) leaves every
 * screen untouched.
 */
export * as authService from "./authService";
export * as clinicService from "./clinicService";
export * as patientService from "./patientService";
export * as scheduleService from "./scheduleService";
export * as clinicalService from "./clinicalService";
export * as financeService from "./financeService";
export * as inventoryService from "./inventoryService";
export * as labService from "./labService";
export * as analyticsService from "./analyticsService";
