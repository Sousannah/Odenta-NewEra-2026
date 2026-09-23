import { APP_BASE, UNI_BASE, appPath, roleDashboards, uniPath } from "@/config/paths";

/**
 * Every role the platform recognises.
 *
 * Three families share one catalogue because one person only ever holds one of
 * them at a time and the session shape is identical:
 *
 *   clinic     — a private practice running Odenta as its PMS
 *   university — a teaching hospital running the student-clinic workflow
 *   platform   — Odenta itself, above both
 *
 * The clinic side is deliberately short. An Egyptian private practice is a
 * dentist-owner, one or more treating dentists, a chairside assistant and a
 * front desk — four jobs, and in a small clinic sometimes three people. The
 * roles a large western group practice splits out do not exist here:
 *
 *   practice manager  the owner runs the floor, or the senior receptionist does
 *   accountant        back office, usually part-time or external; the desk
 *                     takes the money and the owner reads the books
 *   lab technician    the lab is a separate business the clinic sends work to,
 *                     not a member of staff — so a lab case is a *work order to
 *                     a vendor*, tracked by the dentist and chased by the desk
 *
 * Modelling those as logins produced accounts nobody would ever create. They
 * were removed; what they could do moved to the role that really does it.
 *
 * Kept as plain string constants (not an enum object of objects) so the value
 * that travels to the backend is stable and greppable.
 */
export const ROLES = {
  /* clinic */
  OWNER: "owner",
  DENTIST: "dentist",
  ASSISTANT: "assistant",
  RECEPTIONIST: "receptionist",

  /* university */
  UNI_STUDENT: "uni_student",
  UNI_SUPERVISOR: "uni_supervisor",
  UNI_ADMIN: "uni_admin",
  UNI_ASSISTANT: "uni_assistant",
  UNI_IT: "uni_it",

  /* platform — Odenta's own founders' account, above every tenant */
  SUPERADMIN: "superadmin",
};

/**
 * The three shells. Drives layout, sidebar and the portal guard.
 *
 * `PLATFORM` is new, and adding it is what turns "which portal am I in" from a
 * question about the URL into a fact about the account. The platform console's
 * screens are *served from* the university base path for historical reasons —
 * `/university-portal/platform/*` — and that routing detail used to be the only
 * thing defining the founders' account's portal, which is how it came to be
 * treated as a university member that could wander into the clinic.
 *
 * Mirrored by `PLATFORM_PORTAL` in the API's `middleware/portal.js`.
 */
export const PORTALS = { CLINIC: "clinic", UNIVERSITY: "university", PLATFORM: "platform" };

export const CLINIC_ROLE_ORDER = [
  ROLES.OWNER,
  ROLES.DENTIST,
  ROLES.ASSISTANT,
  ROLES.RECEPTIONIST,
];

export const UNIVERSITY_ROLE_ORDER = [
  ROLES.UNI_STUDENT,
  ROLES.UNI_SUPERVISOR,
  ROLES.UNI_ASSISTANT,
  ROLES.UNI_ADMIN,
  ROLES.UNI_IT,
  ROLES.SUPERADMIN,
];

export const ROLE_ORDER = [...CLINIC_ROLE_ORDER, ...UNIVERSITY_ROLE_ORDER];

/**
 * Roles that reach both tenant portals: none.
 *
 * This used to be `[ROLES.SUPERADMIN]`, on the reasoning that an account which
 * operates the product has to be able to stand inside either portal and see
 * what a tenant sees. The goal was right and the mechanism was wrong: standing
 * membership of a tenant shell meant the founders' account rendered that
 * tenant role's navigation, held a permanent seat in every practice, and left
 * no record of having used it.
 *
 * "See what a tenant sees" is now the read-only preview in the Tenants screen —
 * time-boxed, write-refusing, and audited as an `impersonation` event. Same
 * capability, with a door and a log on it.
 *
 * Kept as a named empty list rather than deleted: `rolesInPortal` reads it, and
 * a future genuinely cross-portal role should be a line here and a decision,
 * not a rediscovery of this whole problem.
 */
export const CROSS_PORTAL_ROLES = [];

export const ROLE_META = {
  /* ------------------------------------------------------------- clinic */
  [ROLES.OWNER]: {
    label: "Clinic Owner",
    short: "Owner",
    portal: PORTALS.CLINIC,
    description:
      "The dentist who owns the practice. Runs everything: the day's list, the books, the team, stock and every report.",
    home: roleDashboards.owner,
    tone: "brand",
  },
  [ROLES.DENTIST]: {
    label: "Dentist",
    short: "Dentist",
    portal: PORTALS.CLINIC,
    description:
      "Own chair and caseload: today's list, charting, perio, treatment plans, prescriptions and the lab work they prescribe.",
    home: roleDashboards.dentist,
    tone: "success",
  },
  [ROLES.ASSISTANT]: {
    label: "Dental Assistant",
    short: "Assistant",
    portal: PORTALS.CLINIC,
    description:
      "Chairside: room turnover, the sterilisation cycle log, consumables and getting impressions out to the lab.",
    home: roleDashboards.assistant,
    tone: "warning",
  },
  [ROLES.RECEPTIONIST]: {
    label: "Receptionist",
    short: "Front Desk",
    portal: PORTALS.CLINIC,
    description:
      "Front desk: booking, check-in, registration, recalls, taking the money and chasing work sent to the lab.",
    home: roleDashboards.receptionist,
    tone: "info",
  },

  /* --------------------------------------------------------- university */
  [ROLES.UNI_STUDENT]: {
    label: "Dental Student",
    short: "Student",
    portal: PORTALS.UNIVERSITY,
    description:
      "Own caseload: assigned patients, charting, treatment sheets, and every step submitted for supervisor sign-off.",
    home: roleDashboards.uni_student,
    tone: "brand",
  },
  [ROLES.UNI_SUPERVISOR]: {
    label: "Staff Member",
    short: "Staff",
    portal: PORTALS.UNIVERSITY,
    description:
      "Signs off student work: the review queue, competency progress per student, lab approvals and rotation reports.",
    home: roleDashboards.uni_supervisor,
    tone: "success",
  },
  /**
   * The faculty's head.
   *
   * The key stays `uni_admin` deliberately. It is the string already written
   * into every seeded account, every audit row and every permission check on
   * both sides of the wire, and renaming it to `uni_dean` would be a data
   * migration bought with nothing but a nicer identifier. What a person is
   * called is `label`; what the system calls them is the key, and the two do
   * not have to be the same word.
   *
   * The job is oversight rather than operation: the clinic desk books the
   * chairs and the staff member signs the work off, while the Dean reads
   * whether the school is working — throughput, rotation load, who is behind,
   * who is blocked — and acts on the roster and the noticeboard when it is not.
   */
  [ROLES.UNI_ADMIN]: {
    label: "Dean",
    short: "Dean",
    portal: PORTALS.UNIVERSITY,
    description:
      "Runs the faculty: cohort progress, rotation load and review throughput, the roster, intake appointments, announcements and the activity trail.",
    home: roleDashboards.uni_admin,
    tone: "info",
  },
  [ROLES.UNI_ASSISTANT]: {
    label: "Clinic Assistant",
    short: "Clinic Desk",
    portal: PORTALS.UNIVERSITY,
    description:
      "Front of the student clinic: patient intake, case allocation to students, procedure requests and lab logistics.",
    home: roleDashboards.uni_assistant,
    tone: "warning",
  },
  [ROLES.UNI_IT]: {
    label: "IT Administrator",
    short: "IT",
    portal: PORTALS.UNIVERSITY,
    description:
      "Accounts and access: creating cohorts in bulk, resetting credentials, and keeping role assignments correct.",
    home: roleDashboards.uni_it,
    tone: "neutral",
  },

  /* ----------------------------------------------------------- platform */
  /**
   * Odenta's own account.
   *
   * `portal` is the shell it lands in; `homes` is where it goes in each one,
   * because this is the single role that legitimately stands in both.
   */
  [ROLES.SUPERADMIN]: {
    label: "Super Admin",
    short: "Platform",
    portal: PORTALS.PLATFORM,
    description:
      "Odenta itself: every campus and partner clinic, every account, platform configuration, the full audit trail and system-wide analysis.",
    home: roleDashboards.superadmin,
    /**
     * One home, not two.
     *
     * This used to carry `homes: { clinic: /app/owner, university: /platform }`
     * so the founders' account could land inside a practice. That was the entry
     * point for the whole portal-bleed defect: landing in the clinic shell meant
     * rendering the clinic sidebar, which was filtered on permissions this
     * account held on the client and not on the server.
     *
     * A platform operator now lands on the console wherever they enter, and
     * reaches a practice only through a read-only tenant preview — which the
     * server enforces in `middleware/clinicScope.js`.
     */
    tone: "danger",
  },
};

export const roleLabel = (role) => ROLE_META[role]?.label ?? "Unknown role";
export const portalFor = (role) => ROLE_META[role]?.portal ?? PORTALS.CLINIC;
export const isUniversityRole = (role) => portalFor(role) === PORTALS.UNIVERSITY;

/** True for a role that may stand in either shell. */
export const isCrossPortalRole = (role) => CROSS_PORTAL_ROLES.includes(role);

export const roleHome = (role) =>
  ROLE_META[role]?.home ?? (isUniversityRole(role) ? UNI_BASE : APP_BASE);

/**
 * Where a role goes when it lands on a portal root.
 *
 * For every ordinary role this is just `roleHome` — they only have one. A
 * cross-portal role has one per portal, so `/app` does not bounce the founders'
 * account back to the university platform board.
 */
export const roleHomeIn = (role, portal) =>
  ROLE_META[role]?.homes?.[portal] ?? roleHome(role);

/** The roles a switcher in `portal` should offer, plus anyone who spans both. */
export const rolesInPortal = (portal) => {
  const base = portal === PORTALS.UNIVERSITY ? UNIVERSITY_ROLE_ORDER : CLINIC_ROLE_ORDER;
  return [...base, ...CROSS_PORTAL_ROLES.filter((role) => !base.includes(role))];
};

/** The roles a role switcher should offer — never mixes the two portals. */
export const rolesInPortalOf = (role) => rolesInPortal(portalFor(role));

/**
 * Roles that see patient clinical data — drives the PHI banner and audit log.
 *
 * The founders' account is deliberately absent: it operates the platform and
 * has no business inside a patient record. See ROLE_PERMISSIONS.
 */
export const CLINICAL_ROLES = [
  ROLES.OWNER,
  ROLES.DENTIST,
  ROLES.ASSISTANT,
  ROLES.UNI_STUDENT,
  ROLES.UNI_SUPERVISOR,
];
