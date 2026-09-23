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

/**
 * University-portal permissions.
 *
 * Deliberately a separate catalogue rather than reusing the clinic strings:
 * "approve a treatment plan" and "sign off a student's step" are different
 * acts with different audit meaning, even though both end in an approval.
 */
export const UP = {
  // caseload
  CASE_VIEW_OWN: "uni_case:view_own",
  CASE_VIEW_ALL: "uni_case:view_all",
  CASE_EDIT: "uni_case:edit",
  CASE_ASSIGN: "uni_case:assign",

  // clinical record inside the teaching clinic
  UNI_CHART_EDIT: "uni_chart:edit",
  SHEET_VIEW: "uni_sheet:view",
  SHEET_EDIT: "uni_sheet:edit",
  CONSENT_MANAGE: "uni_consent:manage",
  GALLERY_MANAGE: "uni_gallery:manage",

  // the review loop
  REVIEW_SUBMIT: "uni_review:submit",
  REVIEW_VIEW_OWN: "uni_review:view_own",
  REVIEW_VIEW_ALL: "uni_review:view_all",
  REVIEW_DECIDE: "uni_review:decide",
  SIGNATURE_MANAGE: "uni_signature:manage",

  // students & teaching
  STUDENT_VIEW: "uni_student:view",
  STUDENT_MANAGE: "uni_student:manage",
  REQUIREMENT_VIEW: "uni_requirement:view",
  REQUIREMENT_MANAGE: "uni_requirement:manage",
  ACTIVITY_VIEW: "uni_activity:view",

  // clinic operations
  UNI_APPOINTMENT_VIEW: "uni_appointment:view",
  UNI_APPOINTMENT_MANAGE: "uni_appointment:manage",
  PROCEDURE_REQUEST_VIEW: "uni_procedure_request:view",
  PROCEDURE_REQUEST_DECIDE: "uni_procedure_request:decide",
  UNI_LAB_VIEW: "uni_lab:view",
  UNI_LAB_REQUEST: "uni_lab:request",
  UNI_LAB_DECIDE: "uni_lab:decide",

  // administration
  PEOPLE_VIEW: "uni_people:view",
  PEOPLE_MANAGE: "uni_people:manage",
  NEWS_VIEW: "uni_news:view",
  NEWS_MANAGE: "uni_news:manage",
  UNI_ANALYTICS_VIEW: "uni_analytics:view",
  UNI_REPORT_VIEW: "uni_report:view",

  // platform / IT
  ACCOUNT_ADMIN: "uni_account:admin",
  BULK_CREATE: "uni_account:bulk_create",
  CAMPUS_MANAGE: "uni_campus:manage",
  PARTNER_CLINIC_MANAGE: "uni_partner_clinic:manage",
  PLATFORM_ACTIVITY_VIEW: "uni_platform_activity:view",
};

/**
 * Platform permissions — what Odenta can do to Odenta.
 *
 * A third catalogue, and the separation is the sharpest of the three. Every
 * string in `UP` is scoped to one campus by the server's partition key; every
 * string below is not. `uni_people:manage` lets a university admin edit their
 * own faculty. `platform_account:lifecycle` deactivates anybody's login
 * anywhere. Those two must never be spellable as the same permission, because
 * the day somebody widens a role by copying a line is the day a campus admin
 * can disable an account in a campus they have never heard of.
 *
 * Split finer than one `platform:admin` flag on purpose. Exactly one role holds
 * all of them today, which makes the granularity look like ceremony — but the
 * roles that want a subset are already obvious (a support engineer who reads
 * tenants and touches nothing; a finance operator who sees billing and no
 * account), and each becomes a row in the matrix rather than a refactor of
 * every route guard.
 *
 * Kept in step with `src/domain/permissions.js` on the server by hand, and
 * deliberately duplicated rather than shared: a client that lies about its role
 * must not be able to change the answer.
 */
export const SA = {
  /** The founders' board: KPIs, series, the health of everything at once. */
  OVERVIEW_VIEW: "platform:overview",

  /* tenants — universities and partner clinics */
  TENANT_VIEW: "platform_tenant:view",
  TENANT_MANAGE: "platform_tenant:manage",
  /** Activate, suspend, archive. Split from `manage` because it stops service. */
  TENANT_LIFECYCLE: "platform_tenant:lifecycle",

  /* accounts, across every tenant */
  ACCOUNT_VIEW: "platform_account:view",
  ACCOUNT_MANAGE: "platform_account:manage",
  ACCOUNT_LIFECYCLE: "platform_account:lifecycle",
  ACCOUNT_CREDENTIAL: "platform_account:credential",

  /* roles — the matrix itself */
  ROLE_VIEW: "platform_role:view",
  ROLE_MANAGE: "platform_role:manage",

  /* insight */
  ANALYTICS_VIEW: "platform_analytics:view",
  AUDIT_VIEW: "platform_audit:view",
  EXPORT: "platform:export",

  /* security */
  SECURITY_VIEW: "platform_security:view",
  SECURITY_MANAGE: "platform_security:manage",

  /* servers */
  INFRA_VIEW: "platform_infra:view",
  INFRA_MANAGE: "platform_infra:manage",

  /* money */
  BILLING_VIEW: "platform_billing:view",
  BILLING_MANAGE: "platform_billing:manage",

  /* the platform's own configuration */
  SETTINGS_VIEW: "platform_settings:view",
  SETTINGS_MANAGE: "platform_settings:manage",

  /** Open a tenant's portal, read-only, as a named preview identity. */
  IMPERSONATE: "platform:impersonate",
};

/** Everything a clinic role could ever hold. */
const ALL = Object.values(P);

/** The founders' grant, spelled out rather than implied by a magic bypass. */
const ALL_PLATFORM = Object.values(SA);

/**
 * Role → permission matrix.
 *
 * The clinic side reflects how an Egyptian private practice actually divides
 * the work, not how a large group practice draws its org chart:
 *
 *   owner         the dentist who owns the place — clinical *and* commercial
 *   dentist       treats, charts, plans, prescribes, prescribes lab work
 *   assistant     chairside, sterilisation log, the store, impression dispatch
 *   receptionist  the book, the front door, the cash box, the lab chase
 *
 * Two lines are drawn hard, because they are the ones a backend must enforce:
 *
 *   - the desk never opens a clinical record. `PATIENT_VIEW` without
 *     `PATIENT_CLINICAL_VIEW` is a receptionist who can register a patient and
 *     take their money and still not read their chart.
 *   - only a dentist writes clinical facts. The assistant reads the chart
 *     chairside (they have to — allergies, premedication) and writes nothing
 *     into it; what they *do* own is the sterilisation cycle log, which is the
 *     register a Ministry of Health inspection asks for.
 *
 * Owner is deliberately spelled out as "everything" rather than a magic
 * bypass, so a future read-only-owner variant is a one-line change.
 */
export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: ALL,

  /**
   * A dentist's schedule query is scoped to their own chair — `VIEW_OWN`, not
   * `VIEW_ALL`. They hold `BILL_VIEW` because in a practice this size the
   * treating dentist sets and quotes the fee, but not `PAYMENT_TAKE`: money is
   * received at the desk, against a bill, by one person.
   */
  [ROLES.DENTIST]: [
    P.APPOINTMENT_VIEW_OWN,
    P.APPOINTMENT_CREATE,
    P.APPOINTMENT_EDIT,
    P.APPOINTMENT_CANCEL,
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
    P.STAFF_VIEW,
    P.BILL_VIEW,
    /* The lab is a vendor. The dentist writes the work order — shade,
       material, teeth, due date — and owns the case until it is fitted. */
    P.LAB_CASE_VIEW,
    P.LAB_CASE_MANAGE,
    /* Reads the cycle their tray came out of; does not log cycles. */
    P.STERILIZATION_VIEW,
    P.STOCK_VIEW,
    P.STOCK_CONSUME,
    P.RECALL_VIEW,
    P.RECALL_MANAGE,
    P.REPORT_CLINICAL,
    P.SUPPORT_VIEW,
  ],

  /**
   * Chairside, and the two registers nobody else keeps: sterilisation and the
   * store. Reads the clinical record, writes none of it.
   */
  [ROLES.ASSISTANT]: [
    P.APPOINTMENT_VIEW_ALL,
    P.APPOINTMENT_CHECKIN,
    P.PATIENT_VIEW,
    P.PATIENT_CLINICAL_VIEW,
    P.PRESCRIPTION_VIEW,
    P.TREATMENT_VIEW,
    P.STERILIZATION_VIEW,
    P.STERILIZATION_LOG,
    P.STOCK_VIEW,
    P.STOCK_CONSUME,
    P.STOCK_MANAGE,
    P.PERIPHERAL_VIEW,
    /**
     * Reads the lab worklist; does not write to it.
     *
     * This used to also grant `LAB_CASE_MANAGE`, on the description "pours,
     * packs and dispatches the impression". The server's matrix
     * (`src/domain/clinicPermissions.js`) has never granted it, and every write
     * in `routes/clinic/lab.js` requires it — so the assistant could see the
     * dispatch controls and could not use them.
     *
     * Narrowed here rather than widened there, because a security pass does not
     * hand out a server permission on the strength of a client comment. If
     * dispatching really is this role's job, the fix is to add
     * `P.LAB_CASE_MANAGE` to the assistant in the API's matrix — one line, and a
     * decision somebody makes rather than a drift nobody noticed.
     */
    P.LAB_CASE_VIEW,
    P.SUPPORT_VIEW,
  ],

  /**
   * The front desk. Everything a patient meets before the chair and after it —
   * booking, registration, the cash box, the recall list, and chasing the lab
   * so the patient can be told when their crown is in.
   *
   * No `PATIENT_CLINICAL_VIEW`: demographics and money, never the record.
   */
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
    P.LAB_CASE_VIEW,
    P.LAB_CASE_MANAGE,
    P.RECALL_VIEW,
    P.RECALL_MANAGE,
    P.SUPPORT_VIEW,
  ],

  /* -------------------------------------------------- university portal */

  /**
   * A student may only ever see their own caseload and their own reviews.
   * `CASE_VIEW_OWN` vs `CASE_VIEW_ALL` is the split the backend must enforce —
   * it is the difference between a teaching record and a data breach.
   */
  [ROLES.UNI_STUDENT]: [
    UP.CASE_VIEW_OWN,
    UP.CASE_EDIT,
    UP.UNI_CHART_EDIT,
    UP.SHEET_VIEW,
    UP.SHEET_EDIT,
    UP.CONSENT_MANAGE,
    UP.GALLERY_MANAGE,
    UP.REVIEW_SUBMIT,
    UP.REVIEW_VIEW_OWN,
    UP.REQUIREMENT_VIEW,
    UP.UNI_APPOINTMENT_VIEW,
    UP.UNI_LAB_VIEW,
    UP.UNI_LAB_REQUEST,
    UP.PROCEDURE_REQUEST_VIEW,
    UP.NEWS_VIEW,
    /* Their own numbers only — the analytics endpoint scopes to the session. */
    UP.UNI_ANALYTICS_VIEW,
    P.SUPPORT_VIEW,
  ],

  [ROLES.UNI_SUPERVISOR]: [
    UP.CASE_VIEW_ALL,
    UP.SHEET_VIEW,
    UP.UNI_CHART_EDIT,
    UP.REVIEW_VIEW_ALL,
    UP.REVIEW_DECIDE,
    UP.SIGNATURE_MANAGE,
    UP.STUDENT_VIEW,
    UP.REQUIREMENT_VIEW,
    UP.REQUIREMENT_MANAGE,
    UP.UNI_APPOINTMENT_VIEW,
    UP.UNI_LAB_VIEW,
    UP.UNI_LAB_DECIDE,
    UP.PROCEDURE_REQUEST_VIEW,
    UP.PROCEDURE_REQUEST_DECIDE,
    UP.UNI_ANALYTICS_VIEW,
    UP.UNI_REPORT_VIEW,
    UP.NEWS_VIEW,
    P.SUPPORT_VIEW,
  ],

  /**
   * The clinic desk books chairs and allocates people to them.
   *
   * Two permissions it deliberately does *not* hold, both removed after the
   * desk's sidebar offered screens the guard then refused: `UNI_APPOINTMENT_VIEW`,
   * which is the faculty's published timetable, and `STUDENT_VIEW`, which is
   * the cohort's grades and scorecards. Allocating a case to a student needs
   * neither — `getAllocatableStudents` answers "who still has quota", which
   * is a booking question — and a front desk that can read a student's GPA is
   * a front desk holding something it has no use for.
   */
  [ROLES.UNI_ASSISTANT]: [
    UP.CASE_VIEW_ALL,
    UP.CASE_ASSIGN,
    UP.SHEET_VIEW,
    UP.UNI_APPOINTMENT_MANAGE,
    UP.PROCEDURE_REQUEST_VIEW,
    UP.PROCEDURE_REQUEST_DECIDE,
    UP.UNI_LAB_VIEW,
    UP.UNI_LAB_DECIDE,
    UP.UNI_ANALYTICS_VIEW,
    UP.NEWS_VIEW,
    P.SUPPORT_VIEW,
  ],

  [ROLES.UNI_ADMIN]: [
    UP.CASE_VIEW_ALL,
    UP.CASE_ASSIGN,
    UP.SHEET_VIEW,
    UP.REVIEW_VIEW_ALL,
    UP.STUDENT_VIEW,
    UP.STUDENT_MANAGE,
    UP.REQUIREMENT_VIEW,
    UP.REQUIREMENT_MANAGE,
    UP.ACTIVITY_VIEW,
    UP.UNI_APPOINTMENT_VIEW,
    UP.UNI_APPOINTMENT_MANAGE,
    UP.PROCEDURE_REQUEST_VIEW,
    UP.UNI_LAB_VIEW,
    UP.UNI_LAB_DECIDE,
    UP.PEOPLE_VIEW,
    UP.PEOPLE_MANAGE,
    UP.NEWS_VIEW,
    UP.NEWS_MANAGE,
    UP.UNI_ANALYTICS_VIEW,
    UP.UNI_REPORT_VIEW,
    P.SUPPORT_VIEW,
  ],

  [ROLES.UNI_IT]: [
    UP.PEOPLE_VIEW,
    UP.ACCOUNT_ADMIN,
    UP.BULK_CREATE,
    UP.ACTIVITY_VIEW,
    UP.UNI_ANALYTICS_VIEW,
    UP.NEWS_VIEW,
    P.SUPPORT_VIEW,
  ],

  /* ------------------------------------------------------------ platform */

  /**
   * Odenta's own account — the founders.
   *
   * The rule it is built on: **operate the product, not the practice.** It has
   * total control of everything that is Odenta's — tenants, accounts, roles,
   * seats, platform configuration, the activity trail and the audit log — and
   * it can read every number in both portals, which is what makes system-wide
   * analysis possible. It does not act inside a customer's clinic: it does not
   * take a payment, move an account balance, cancel an appointment, sign off a
   * student or advance a lab case. Those are the tenant's acts, and an audit
   * row that says "Odenta did it" is worse than no row at all.
   *
   * It holds no clinical permission. `PATIENT_VIEW` grants the patient list and
   * the counts the analytics screens need; `PATIENT_CLINICAL_VIEW`, the chart,
   * the sheets, the dossier and `CASE_VIEW_ALL` are all withheld, so a platform
   * operator cannot open a patient record in either portal. That is deliberate,
   * both because it is right and because Egypt's data protection law (151/2020)
   * treats health data as sensitive personal data. Widening it is one line
   * here — but it should be a decision, not a default.
   */
  [ROLES.SUPERADMIN]: [
    /**
     * --- the platform itself: every capability, spelled out ---
     *
     * This is the grant the whole `/platform` surface is gated on. What it
     * still does not include is any clinical read: a super admin can suspend a
     * campus, revoke its accounts and read every number it generates, and
     * cannot open one patient's chart. Not an oversight to be tidied up —
     * health data is sensitive personal data under Egypt's law 151/2020, people
     * who operate a platform have no clinical reason to see it, and "the
     * founder can read everything" is the sentence that turns one compromised
     * laptop into a national incident.
     */
    ...ALL_PLATFORM,

    /**
     * --- the teaching side: read the numbers, open no record ---
     *
     * Each of these is granted by `src/domain/permissions.js` on the server
     * too, and that is now a property a test asserts rather than a convention
     * two files are supposed to keep — see `nav/README.md`.
     */
    UP.STUDENT_VIEW,
    UP.REQUIREMENT_VIEW,
    UP.ACTIVITY_VIEW,
    UP.UNI_APPOINTMENT_VIEW,
    UP.PROCEDURE_REQUEST_VIEW,
    UP.UNI_LAB_VIEW,
    UP.UNI_ANALYTICS_VIEW,
    UP.UNI_REPORT_VIEW,

    /* --- tenant administration, which is Odenta's own job --- */
    UP.PEOPLE_VIEW,
    UP.PEOPLE_MANAGE,
    UP.ACCOUNT_ADMIN,
    UP.BULK_CREATE,
    UP.CAMPUS_MANAGE,
    UP.PARTNER_CLINIC_MANAGE,
    UP.PLATFORM_ACTIVITY_VIEW,
    UP.NEWS_VIEW,
    UP.NEWS_MANAGE,
    P.SETTINGS_MANAGE,
    P.AUDIT_VIEW,
    P.SUPPORT_VIEW,

    /**
     * --- the fourteen clinic permissions that used to be here, and are not ---
     *
     * `APPOINTMENT_VIEW_ALL`, `PATIENT_VIEW`, `TREATMENT_VIEW`, `STAFF_VIEW`,
     * `BILL_VIEW`, `ACCOUNT_VIEW`, `PURCHASE_VIEW`, `STOCK_VIEW`,
     * `PERIPHERAL_VIEW`, `LAB_CASE_VIEW`, `STERILIZATION_VIEW`, `RECALL_VIEW`,
     * `REPORT_CLINICAL` and `REPORT_FINANCIAL` were granted here and granted
     * nowhere on the server. Three consequences followed from that one drift:
     *
     *   the platform account rendered the **clinic owner's entire sidebar** the
     *   moment it opened `/app`, because the clinic navigation tree was built by
     *   filtering on exactly these strings;
     *
     *   every one of those entries answered `403`, because the server's matrix
     *   had never heard of them — a sidebar full of promises the API would not
     *   keep;
     *
     *   and the fix looked like "add them to the backend too", which is the
     *   wrong direction: it would have given the one account that can reach
     *   every customer a standing, unlogged seat inside every practice.
     *
     * They are gone. A platform operator who needs to see a practice opens a
     * read-only preview from the Tenants screen, which is short-lived, refuses
     * every write, and writes an `impersonation` security event naming them.
     * `middleware/clinicScope.js` enforces it — a platform session carrying no
     * preview claim is refused at the clinic gate.
     */
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
