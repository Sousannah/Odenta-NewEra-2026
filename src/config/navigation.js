import { P } from "@/auth/permissions";
import { app } from "@/config/paths";
import { navFor, navItemsFor } from "@/config/nav";

/**
 * The clinic portal's route-permission map, and two thin re-exports.
 *
 * This file used to own a twenty-entry navigation tree that every clinic role's
 * sidebar was derived from by filtering on permissions. That tree is gone. Each
 * role's sidebar is now written out in full in `config/nav/clinicRoles.js`, and
 * `navFor(user)` is a lookup by role rather than a filter — see
 * `config/nav/README.md` for the two failures the filtered version produced, the
 * visible one being a Super Admin rendering the clinic owner's navigation.
 *
 * What stays here is `ROUTE_PERMISSIONS`: the map the route guard reads when
 * somebody types a URL. It is a different question from "what is this role
 * offered" — a supervisor is not offered the case browser and can still follow a
 * link into one — so it stays a per-path map rather than being folded into the
 * per-role lists.
 *
 * The two functions below are kept so existing imports do not have to move. They
 * delegate and add nothing.
 */

/** @deprecated Import `navFor` from `@/config/nav`. */
export const navigationFor = navFor;

/** @deprecated Import `navItemsFor` from `@/config/nav`. */
export const allNavItems = navItemsFor;

/** Route-level permission map — the guard reads this. */
export const ROUTE_PERMISSIONS = {
  [app.schedule]: [P.APPOINTMENT_VIEW_ALL, P.APPOINTMENT_VIEW_OWN],
  [app.patients]: P.PATIENT_VIEW,
  [app.recalls]: P.RECALL_VIEW,
  [app.treatments]: P.TREATMENT_VIEW,
  [app.staff]: P.STAFF_VIEW,
  [app.treatmentPlans]: [P.TREATMENT_PLAN_CREATE, P.PATIENT_CLINICAL_VIEW],
  [app.labCases]: P.LAB_CASE_VIEW,
  [app.sterilisation]: P.STERILIZATION_VIEW,
  [app.accounts]: P.ACCOUNT_VIEW,
  [app.sales]: P.BILL_VIEW,
  [app.purchases]: P.PURCHASE_VIEW,
  [app.paymentMethods]: P.PAYMENT_METHOD_MANAGE,
  [app.stocks]: P.STOCK_VIEW,
  [app.peripherals]: P.PERIPHERAL_VIEW,
  [app.report]: [P.REPORT_CLINICAL, P.REPORT_FINANCIAL],
  [app.audit]: P.AUDIT_VIEW,
  [app.support]: P.SUPPORT_VIEW,
};
