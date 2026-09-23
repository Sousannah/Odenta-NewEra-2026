/**
 * Domain services — the only layer that knows about HTTP.
 *
 * Screens import from here and never from `@/api`. Each function's
 * name and return shape is the contract; swapping the driver in
 * `src/api/client.js` (or replacing a body with a different call) leaves every
 * screen untouched.
 */
export * as authService from "./authService";
export * as clinicService from "./clinicService";
/** Chairside: the board, the chairs, the register and the store. */
export * as assistantService from "./assistantService";
/** The practice owner: the board, and who owes what. */
export * as ownerService from "./ownerService";
export * as patientService from "./patientService";
export * as scheduleService from "./scheduleService";
export * as clinicalService from "./clinicalService";
export * as financeService from "./financeService";
export * as inventoryService from "./inventoryService";
export * as labService from "./labService";
export * as analyticsService from "./analyticsService";
export * as siteService from "./siteService";
export * as universityService from "./universityService";
export * as platformService from "./platformService";
