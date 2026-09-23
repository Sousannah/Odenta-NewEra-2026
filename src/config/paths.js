/**
 * Every URL in the app, in one place.
 *
 * The frontend has three halves that live at different roots:
 *
 *   `/`           the public Odenta site — marketing, universities, booking, AI demo
 *   `/app`        the signed-in clinic portal — dashboards and feature screens
 *   `/university` the signed-in university portal — student clinic teaching workflow
 *
 * Nothing hardcodes those strings. Move a portal to a subdomain later and this
 * file is the only edit.
 */

export const APP_BASE = "/app";
export const UNI_BASE = "/university-portal";

/** Prefix a clinic-portal path: `appPath("/patients")` → `/app/patients`. */
export const appPath = (path = "") => `${APP_BASE}${path}`;

/** Prefix a university-portal path. */
export const uniPath = (path = "") => `${UNI_BASE}${path}`;

/** Public marketing site. */
export const site = {
  home: "/",
  services: "/services",
  universityServices: "/university-services",
  universities: "/universities",
  university: (id) => `/universities/${id}`,
  book: "/book",
  /**
   * A patient card, opened from the QR printed on it.
   *
   * Public by necessity: the people who scan a card are the patient holding
   * it and whoever they show it to, and none of them have a portal account.
   * The token in the path is the whole credential, so it is unguessable and
   * the screen behind it is an identity card, not a record.
   *
   * No server implements `GET /university/cards/:token` yet, and nothing in the
   * app issues a token, so this route currently has no way to be reached. It is
   * left declared rather than deleted because the card is a designed feature —
   * but it is unbuilt, not broken, and should not be linked to until the
   * token-issuing path exists.
   */
  card: (token) => `/card/${token}`,
  bookingConfirmation: "/book/confirmation",
  clinics: "/clinics",
  about: "/about",
  contact: "/contact",
  tryAi: "/try-ai",
  pricing: "/pricing",
  privacy: "/privacy",
  terms: "/terms",
};

export const auth = {
  signIn: "/sign-in",
  forgotPassword: "/forgot-password",

  /**
   * Redeeming an invitation. Public by necessity — the person following the
   * link has no session yet, and the token in the query string is the only
   * thing that authorises them.
   */
  activate: "/activate",

  /**
   * Setting a new password.
   *
   * Signed in, but outside both portal shells: somebody sent here is holding a
   * temporary credential an administrator handed them, and the screen's whole
   * job is to be the only thing they can do until they have replaced it.
   */
  changePassword: "/change-password",
};

/** Signed-in clinic portal. */
export const app = {
  root: APP_BASE,
  schedule: appPath("/schedule"),
  patients: appPath("/patients"),
  patient: (id) => appPath(`/patients/${id}`),
  recalls: appPath("/recalls"),
  treatments: appPath("/treatments"),
  staff: appPath("/staff"),
  treatmentPlans: appPath("/treatment-plans"),
  labCases: appPath("/lab-cases"),
  sterilisation: appPath("/sterilisation"),
  accounts: appPath("/accounts"),
  sales: appPath("/sales"),
  purchases: appPath("/purchases"),
  paymentMethods: appPath("/payment-methods"),
  stocks: appPath("/stocks"),
  peripherals: appPath("/peripherals"),
  report: appPath("/report"),
  audit: appPath("/audit"),
  support: appPath("/support"),
};

/**
 * Signed-in university portal.
 *
 * The teaching clinic has its own vocabulary — cases instead of bills, reviews
 * instead of approvals, rotations instead of rotas — so it gets its own route
 * table rather than being bolted onto `app`.
 */
export const uni = {
  root: UNI_BASE,

  /* clinical work */
  cases: uniPath("/cases"),
  case: (id) => uniPath(`/cases/${id}`),
  caseTab: (id, tab) => uniPath(`/cases/${id}/${tab}`),
  patientCards: uniPath("/patient-cards"),
  schedule: uniPath("/schedule"),
  labRequests: uniPath("/lab-requests"),
  procedureRequests: uniPath("/procedure-requests"),

  /**
   * The student clinic.
   *
   * A student works a *patient record*, not a case row: they open the same
   * person over and over and move between examination sheet, chart, gallery and
   * consent. That record is addressed by national id — the number printed on
   * the patient's card — so a student can type it off the card and land on the
   * right chart.
   */
  myPatients: uniPath("/my-patients"),
  patient: (nationalId) => uniPath(`/patients/${nationalId}`),
  patientTab: (nationalId, tab) => uniPath(`/patients/${nationalId}/${tab}`),
  calendar: uniPath("/calendar"),
  studentLab: uniPath("/lab"),

  /* the study companion — reference and self-assessment */
  learning: uniPath("/learning-hub"),
  performance: uniPath("/performance"),
  profile: uniPath("/profile"),

  /**
   * The faculty side of the same person.
   *
   * A supervisor reads a record they did not write, so the dossier is its own
   * address rather than a mode of the student's record: read-only, assembled
   * in one call, and reachable from any row that names a patient.
   */
  dossier: (nationalId) => uniPath(`/dossier/${nationalId}`),

  /* the desk's registry — every patient in the teaching clinic, not a caseload */
  registry: uniPath("/registry"),

  /* teaching */
  reviews: uniPath("/reviews"),
  signature: uniPath("/signature"),
  reviewQueue: uniPath("/review-queue"),
  students: uniPath("/students"),
  student: (id) => uniPath(`/students/${id}`),
  requirements: uniPath("/requirements"),
  reports: uniPath("/reports"),

  /* administration */
  people: uniPath("/people"),
  appointments: uniPath("/appointments"),
  news: uniPath("/news"),
  activity: uniPath("/activity"),
  analytics: uniPath("/analytics"),

  /* platform */
  accounts: uniPath("/accounts"),
  bulkCreate: uniPath("/bulk-create"),
  campuses: uniPath("/campuses"),
  partnerClinics: uniPath("/partner-clinics"),
  support: uniPath("/support"),
};

/**
 * Odenta's own console.
 *
 * Its own route table under `/university-portal/platform/*` rather than more
 * entries in `uni`, for the same reason the server mounts `/api/platform` as a
 * sibling of `/api/university`: these screens are *above* every tenant, and
 * mixing them into the campus table would make "which of these is scoped to a
 * campus" a question you have to answer per route rather than per prefix.
 *
 * It lives inside the university shell because the founders' account has to be
 * able to stand in a portal and see what a tenant sees — the layout is shared,
 * the data boundary is not.
 */
export const PLATFORM_BASE = uniPath("/platform");
export const platformPath = (path = "") => `${PLATFORM_BASE}${path}`;

export const platform = {
  root: PLATFORM_BASE,
  /** The board. Same address as the role's dashboard — it is the dashboard. */
  overview: PLATFORM_BASE,

  tenants: platformPath("/tenants"),
  tenant: (tenantId) => platformPath(`/tenants/${tenantId}`),

  accounts: platformPath("/accounts"),
  account: (userId) => platformPath(`/accounts/${userId}`),

  analytics: platformPath("/analytics"),
  activity: platformPath("/activity"),
  security: platformPath("/security"),
  servers: platformPath("/servers"),
  billing: platformPath("/billing"),
  roles: platformPath("/roles"),
  settings: platformPath("/settings"),

  /**
   * The console's own Support screen.
   *
   * Same component as the tenant one, at a platform address, and that is not
   * duplication for its own sake. The platform account is not a member of the
   * university portal any more, so `uni.support` is a screen the portal guard
   * correctly bounces it away from — and a Support link that redirects you to
   * your dashboard is worse than no Support link.
   */
  support: platformPath("/support"),
};

/** One dashboard per role — `ROLE_META[role].home` reads from here. */
export const roleDashboards = {
  /* clinic */
  owner: appPath("/owner"),
  dentist: appPath("/dentist"),
  assistant: appPath("/assistant"),
  receptionist: appPath("/front-desk"),

  /* university */
  uni_student: uniPath("/student"),
  uni_supervisor: uniPath("/supervisor"),
  uni_admin: uniPath("/admin"),
  uni_assistant: uniPath("/clinic-desk"),
  uni_it: uniPath("/it"),

  /**
   * Platform. The founders' account also has a clinic-side landing —
   * `ROLE_META[ROLES.SUPERADMIN].homes` carries both.
   */
  superadmin: uniPath("/platform"),
};

export const paths = {
  site,
  auth,
  app,
  uni,
  platform,
  roleDashboards,
  APP_BASE,
  UNI_BASE,
  PLATFORM_BASE,
  appPath,
  uniPath,
  platformPath,
};

export default paths;
