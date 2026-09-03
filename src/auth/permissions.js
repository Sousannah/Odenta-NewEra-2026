import { ROLES } from "./roles";

/**
 * Permission catalogue — `resource:action`.
 *
 * The UI never checks a role directly; it checks a permission. That way adding
 * a role, or moving a capability between roles, is a change to ROLE_PERMISSIONS
 * only. The same strings are meant to be enforced server-side: the client-side
 * checks here are for navigation and affordances, never for security.
 */
export const P = {
  // scheduling
  APPOINTMENT_VIEW_ALL: "appointment:view_all",
  APPOINTMENT_VIEW_OWN: "appointment:view_own",
  APPOINTMENT_CREATE: "appointment:create",
  APPOINTMENT_EDIT: "appointment:edit",
  APPOINTMENT_CANCEL: "appointment:cancel",
  APPOINTMENT_CHECKIN: "appointment:checkin",

  // patients — demographics vs clinical record are deliberately separate
  PATIENT_VIEW: "patient:view",
  PATIENT_CREATE: "patient:create",
  PATIENT_EDIT: "patient:edit",
  PATIENT_CLINICAL_VIEW: "patient_clinical:view",
  PATIENT_CLINICAL_EDIT: "patient_clinical:edit",

  // clinical work
  CHART_EDIT: "chart:edit",
  PERIO_EDIT: "perio:edit",
  TREATMENT_PLAN_CREATE: "treatment_plan:create",
  TREATMENT_PLAN_APPROVE: "treatment_plan:approve",
  PRESCRIPTION_WRITE: "prescription:write",
  PRESCRIPTION_VIEW: "prescription:view",

  // catalogue
  TREATMENT_VIEW: "treatment:view",
  TREATMENT_MANAGE: "treatment:manage",

  // people
  STAFF_VIEW: "staff:view",
  STAFF_MANAGE: "staff:manage",
  ROTA_MANAGE: "rota:manage",

  // money
  BILL_VIEW: "bill:view",
  PAYMENT_TAKE: "payment:take",
  ACCOUNT_VIEW: "account:view",
  ACCOUNT_MANAGE: "account:manage",
  PURCHASE_VIEW: "purchase:view",
  PURCHASE_MANAGE: "purchase:manage",
  PAYMENT_METHOD_MANAGE: "payment_method:manage",

  // assets
  STOCK_VIEW: "stock:view",
  STOCK_MANAGE: "stock:manage",
  STOCK_CONSUME: "stock:consume",
  PERIPHERAL_VIEW: "peripheral:view",
  PERIPHERAL_MANAGE: "peripheral:manage",

  // lab & infection control
  LAB_CASE_VIEW: "lab_case:view",
  LAB_CASE_MANAGE: "lab_case:manage",
  STERILIZATION_VIEW: "sterilization:view",
  STERILIZATION_LOG: "sterilization:log",

  // recalls & comms
  RECALL_VIEW: "recall:view",
  RECALL_MANAGE: "recall:manage",

  // oversight
  REPORT_CLINICAL: "report:clinical",
  REPORT_FINANCIAL: "report:financial",
  AUDIT_VIEW: "audit:view",
  SETTINGS_MANAGE: "settings:manage",
  SUPPORT_VIEW: "support:view",
};

const ALL = Object.values(P);

/**
 * Role → permission matrix.
 * Owner is deliberately spelled out as "everything" rather than a magic
 * bypass, so a future read-only-owner variant is a one-line change.
 */
export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: ALL,

  [ROLES.MANAGER]: [
    P.APPOINTMENT_VIEW_ALL,
    P.APPOINTMENT_CREATE,
    P.APPOINTMENT_EDIT,
    P.APPOINTMENT_CANCEL,
    P.APPOINTMENT_CHECKIN,
    P.PATIENT_VIEW,
    P.PATIENT_CREATE,
    P.PATIENT_EDIT,
    P.PATIENT_CLINICAL_VIEW,
    P.PRESCRIPTION_VIEW,
    P.TREATMENT_VIEW,
    P.TREATMENT_MANAGE,
    P.STAFF_VIEW,
    P.STAFF_MANAGE,
    P.ROTA_MANAGE,
    P.BILL_VIEW,
    P.PAYMENT_TAKE,
    P.ACCOUNT_VIEW,
    P.PURCHASE_VIEW,
    P.PURCHASE_MANAGE,
    P.STOCK_VIEW,
    P.STOCK_MANAGE,
    P.STOCK_CONSUME,
    P.PERIPHERAL_VIEW,
    P.PERIPHERAL_MANAGE,
    P.LAB_CASE_VIEW,
    P.LAB_CASE_MANAGE,
    P.STERILIZATION_VIEW,
    P.RECALL_VIEW,
    P.RECALL_MANAGE,
    P.REPORT_CLINICAL,
    P.REPORT_FINANCIAL,
    P.SETTINGS_MANAGE,
    P.SUPPORT_VIEW,
  ],

  [ROLES.DENTIST]: [
    P.APPOINTMENT_VIEW_OWN,
    P.APPOINTMENT_CREATE,
    P.APPOINTMENT_EDIT,
    P.PATIENT_VIEW,
    P.PATIENT_EDIT,
    P.PATIENT_CLINICAL_VIEW,
    P.PATIENT_CLINICAL_EDIT,
    P.CHART_EDIT,
    P.PERIO_EDIT,
    P.TREATMENT_PLAN_CREATE,
    P.TREATMENT_PLAN_APPROVE,
    P.PRESCRIPTION_WRITE,
    P.PRESCRIPTION_VIEW,
    P.TREATMENT_VIEW,
    P.LAB_CASE_VIEW,
    P.LAB_CASE_MANAGE,
    P.STOCK_VIEW,
    P.STOCK_CONSUME,
    P.RECALL_VIEW,
    P.RECALL_MANAGE,
    P.REPORT_CLINICAL,
    P.SUPPORT_VIEW,
  ],

  [ROLES.ASSISTANT]: [
    P.APPOINTMENT_VIEW_ALL,
    P.APPOINTMENT_CHECKIN,
    P.PATIENT_VIEW,
    P.PATIENT_CLINICAL_VIEW,
    P.TREATMENT_VIEW,
    P.STOCK_VIEW,
    P.STOCK_CONSUME,
    P.PERIPHERAL_VIEW,
    P.STERILIZATION_VIEW,
    P.STERILIZATION_LOG,
    P.LAB_CASE_VIEW,
    P.SUPPORT_VIEW,
  ],

  [ROLES.RECEPTIONIST]: [
    P.APPOINTMENT_VIEW_ALL,
    P.APPOINTMENT_CREATE,
    P.APPOINTMENT_EDIT,
    P.APPOINTMENT_CANCEL,
    P.APPOINTMENT_CHECKIN,
    P.PATIENT_VIEW,
    P.PATIENT_CREATE,
    P.PATIENT_EDIT,
    P.TREATMENT_VIEW,
    P.STAFF_VIEW,
    P.BILL_VIEW,
    P.PAYMENT_TAKE,
    P.RECALL_VIEW,
    P.RECALL_MANAGE,
    P.SUPPORT_VIEW,
  ],

  [ROLES.ACCOUNTANT]: [
    P.PATIENT_VIEW,
    P.TREATMENT_VIEW,
    P.BILL_VIEW,
    P.PAYMENT_TAKE,
    P.ACCOUNT_VIEW,
    P.ACCOUNT_MANAGE,
    P.PURCHASE_VIEW,
    P.PURCHASE_MANAGE,
    P.PAYMENT_METHOD_MANAGE,
    P.STOCK_VIEW,
    P.PERIPHERAL_VIEW,
    P.REPORT_FINANCIAL,
    P.AUDIT_VIEW,
    P.SUPPORT_VIEW,
  ],

  [ROLES.LAB_TECH]: [
    P.PATIENT_VIEW,
    P.TREATMENT_VIEW,
    P.LAB_CASE_VIEW,
    P.LAB_CASE_MANAGE,
    P.PERIPHERAL_VIEW,
    P.SUPPORT_VIEW,
  ],
};

export const permissionsFor = (role) => ROLE_PERMISSIONS[role] ?? [];

/**
 * @param {{permissions?: string[]}} user
 * @param {string|string[]} required  a single permission, or "any of these"
 */
export function hasPermission(user, required) {
  if (!required) return true;
  const granted = user?.permissions;
  if (!granted?.length) return false;
  const list = Array.isArray(required) ? required : [required];
  return list.some((permission) => granted.includes(permission));
}

/** "all of these" variant, for actions gated on a combination. */
export function hasEveryPermission(user, required = []) {
  const granted = user?.permissions ?? [];
  return required.every((permission) => granted.includes(permission));
}
