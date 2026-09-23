import { P, SA, UP } from "@/auth/permissions";
import { platform, uni } from "@/config/paths";
import { navFor, navItemsFor } from "@/config/nav";

/**
 * The teaching portal's route-permission map, the off-nav routes, and two thin
 * re-exports.
 *
 * This file used to own a thirty-entry navigation tree filtered per user, plus
 * two escape hatches — `only:` and `except:` — that named roles which held a
 * permission but should not be offered the destination. Those escape hatches
 * were the tell: they are role checks bolted onto a role-blind mechanism,
 * written because the filter gave the wrong answer for the clinic desk and for
 * a staff member.
 *
 * Every role's sidebar is now written out in `config/nav/universityRoles.js`,
 * and the platform console in `config/nav/superadmin.js`. `navFor(user)` looks
 * a role up rather than filtering a tree — see `config/nav/README.md`.
 *
 * What stays here is what is genuinely about *routes* rather than about
 * navigation: the permission the guard checks when somebody types a URL, and the
 * handful of screens that title the top bar without ever appearing in a sidebar.
 */

/** @deprecated Import `navFor` from `@/config/nav`. */
export const universityNavigationFor = navFor;

/**
 * Routes that title the top bar but are deliberately not in the sidebar —
 * reached from the screen that needs them rather than browsed to.
 */
const OFF_NAV = [
  { key: "signature", label: "My Signature", to: uni.signature, permission: UP.SIGNATURE_MANAGE },
  /* Matched by prefix, so the national ID in the URL does not have to be known. */
  { key: "dossier", label: "Patient dossier", to: uni.dossier(""), permission: UP.CASE_VIEW_ALL },
  { key: "cases", label: "Cases", to: uni.cases, permission: [UP.CASE_VIEW_OWN, UP.CASE_VIEW_ALL] },
  { key: "patient-cards", label: "Patient Cards", to: uni.patientCards, permission: [UP.CASE_VIEW_OWN, UP.CASE_VIEW_ALL] },
  { key: "procedure-requests", label: "Procedure Requests", to: uni.procedureRequests, permission: UP.PROCEDURE_REQUEST_VIEW },
  /**
   * Everybody's own account page, reached from the avatar menu in the top bar
   * rather than from a sidebar — it belongs to the person, not to the job. A
   * student also gets it in their My Study group; for every other role this
   * entry is the only thing that titles the route.
   */
  { key: "profile", label: "My Profile", to: uni.profile },
];

/**
 * Flat list used by the top bar to title the current route.
 *
 * The role's own sidebar plus the off-nav screens it may open. `allow` is still
 * a permission check here and that is correct: these are destinations a person
 * arrives at by following a link, so "may they open it" is exactly the question,
 * where a sidebar asks the different question "is this part of their job".
 */
export function allUniversityNavItems(user) {
  const shown = navItemsFor(user);
  const keys = new Set(shown.map((item) => item.to));
  return [
    ...shown,
    ...OFF_NAV.filter((item) => !keys.has(item.to) && allow(user, item.permission)),
  ];
}

const allow = (user, permission) => {
  if (!permission) return true;
  const granted = user?.permissions ?? [];
  const list = Array.isArray(permission) ? permission : [permission];
  return list.some((entry) => granted.includes(entry));
};

/** Route-level permission map — the guard reads this. */
export const UNIVERSITY_ROUTE_PERMISSIONS = {
  [uni.cases]: [UP.CASE_VIEW_OWN, UP.CASE_VIEW_ALL],
  [uni.myPatients]: UP.CASE_VIEW_OWN,
  [uni.patientCards]: [UP.CASE_VIEW_OWN, UP.CASE_VIEW_ALL],
  /**
   * The chair board, for anybody who works a chair or books one.
   *
   * It used to be a student-only screen gated on `REVIEW_SUBMIT`. The board
   * itself is not about being signed off — it is the day, the week and the
   * month of a clinic — so a staff member and the desk read the same picture
   * scoped to the whole clinic rather than to one caseload.
   */
  [uni.calendar]: [UP.REVIEW_SUBMIT, UP.UNI_APPOINTMENT_VIEW, UP.UNI_APPOINTMENT_MANAGE],
  [uni.schedule]: UP.UNI_APPOINTMENT_VIEW,
  [uni.procedureRequests]: UP.PROCEDURE_REQUEST_VIEW,
  [uni.labRequests]: UP.UNI_LAB_VIEW,
  [uni.studentLab]: UP.UNI_LAB_REQUEST,
  [uni.reviews]: UP.REVIEW_VIEW_OWN,
  [uni.reviewQueue]: UP.REVIEW_VIEW_ALL,
  [uni.students]: UP.STUDENT_VIEW,
  [uni.signature]: UP.SIGNATURE_MANAGE,
  [uni.requirements]: UP.REQUIREMENT_VIEW,
  [uni.performance]: UP.REVIEW_SUBMIT,
  [uni.learning]: UP.REVIEW_SUBMIT,
  /**
   * Ungated on purpose. Every signed-in member of the portal reaches their own
   * page from the avatar menu, and the screen already says so when the account
   * behind it has no student record — a staff member sent there should read
   * "this is a student's record", not "you do not have access".
   */
  [uni.profile]: null,
  [uni.people]: UP.PEOPLE_VIEW,
  [uni.appointments]: UP.UNI_APPOINTMENT_MANAGE,
  [uni.registry]: UP.CASE_ASSIGN,
  [uni.activity]: UP.ACTIVITY_VIEW,
  [uni.news]: UP.NEWS_VIEW,
  [uni.accounts]: UP.ACCOUNT_ADMIN,
  [uni.bulkCreate]: UP.BULK_CREATE,
  [uni.campuses]: UP.CAMPUS_MANAGE,
  [uni.partnerClinics]: UP.PARTNER_CLINIC_MANAGE,

  /**
   * The platform console.
   *
   * Each screen names the permission that also gates its endpoints on the
   * server, so a URL typed by hand is refused by the same rule that hides the
   * link. The client-side check is for the affordance; the server's is the
   * security — see the note at the top of `auth/permissions.js`.
   */
  [platform.overview]: SA.OVERVIEW_VIEW,
  [platform.tenants]: SA.TENANT_VIEW,
  [platform.accounts]: SA.ACCOUNT_VIEW,
  [platform.analytics]: SA.ANALYTICS_VIEW,
  [platform.security]: SA.SECURITY_VIEW,
  [platform.servers]: SA.INFRA_VIEW,
  [platform.billing]: SA.BILLING_VIEW,
  [platform.activity]: SA.AUDIT_VIEW,
  [platform.roles]: SA.ROLE_VIEW,
  [platform.settings]: SA.SETTINGS_VIEW,
  [platform.support]: P.SUPPORT_VIEW,
  /** The detail routes, which carry an id and so cannot be keyed by path. */
  "platform-tenant": SA.TENANT_VIEW,
  "platform-account": SA.ACCOUNT_VIEW,
  [uni.analytics]: UP.UNI_ANALYTICS_VIEW,
  [uni.reports]: UP.UNI_REPORT_VIEW,
  [uni.support]: P.SUPPORT_VIEW,

  /* the patient record and every tab inside it */
  "patient-record": UP.CASE_VIEW_OWN,

  /**
   * The faculty dossier. Gated on CASE_VIEW_ALL rather than CASE_VIEW_OWN:
   * it is the read of a record you did not write, which is exactly the
   * distinction those two permissions draw.
   */
  "patient-dossier": UP.CASE_VIEW_ALL,
};
