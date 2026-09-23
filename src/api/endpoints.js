/**
 * Every server path the app knows about, in one place.
 *
 * Functions rather than template strings at the call site so a path change is
 * a single edit. `npm run contract` in the backend imports this file and diffs
 * it against the live route table, so a path that drifts fails a check rather
 * than a screen.
 */
export const endpoints = {
  auth: {
    session: "/auth/session",
    signIn: "/auth/sign-in",
    signOut: "/auth/sign-out",

    /**
     * Federated sign-in. The browser gets an ID token from the provider and
     * posts it here; the server verifies the signature and matches the verified
     * address against an account that already exists. Neither endpoint can
     * create one — see the backend's `routes/auth.js`.
     *
     * `providers` says which buttons to render, so a deployment that has not
     * registered an OAuth application shows a password form and nothing else.
     */
    providers: "/auth/providers",
    google: "/auth/google",
    microsoft: "/auth/microsoft",

    /**
     * Redeeming an invitation, and the only unauthenticated write in the app.
     *
     * An account IT created by invitation holds no password at all — the person
     * sets their own here, once, against a single-use token. The GET answers
     * "whose invitation is this", so the screen can greet them by name rather
     * than presenting an anonymous form asking for a password.
     */
    activate: "/auth/activate",

    /**
     * Change your own password.
     *
     * This is what makes a temporary password temporary. Without it,
     * `mustResetPassword` is a badge on an admin screen and the credential an
     * administrator read out over the phone stays valid for the rest of the
     * year. Requires the current password even though the caller already holds
     * a session, and re-establishes the session afterwards because the old
     * refresh family dies with the password it was minted under.
     */
    changePassword: "/auth/change-password",
  },

  clinic: {
    current: "/clinic",
    branches: "/clinic/branches",
  },

  staff: {
    list: "/staff",
    detail: (id) => `/staff/${id}`,
    dentists: "/staff/dentists",
    rota: "/staff/rota",
  },

  patients: {
    list: "/patients",
    detail: (id) => `/patients/${id}`,

    /**
     * The whole clinical record, in one request.
     *
     * The patient screen needs nine things — the patient, their medical
     * history, the chart, the perio map, the notes, the prescriptions, the
     * plans, the attachments and the visit history — and used to fetch six of
     * them as six calls. Server-side they all live in one Cosmos partition
     * keyed by patient, so one query returns the lot; six calls was six
     * charges and six chances for the screen to half-load.
     *
     * The granular endpoints below are kept because two other screens want a
     * slice rather than the whole thing.
     */
    record: (id) => `/patients/${id}/record`,

    clinical: (id) => `/patients/${id}/clinical`,
    chart: (id) => `/patients/${id}/chart`,
    perio: (id) => `/patients/${id}/perio`,

    /**
     * Alerts, allergies, medications, ASA class, caries risk.
     *
     * Its own endpoint because it is its own document, and it lives on the
     * clinical side of the line: a receptionist holds `patient:view` and reads
     * `detail` above, which carries none of this. A clinician reads it here or
     * gets it merged into `record`.
     */
    medical: (id) => `/patients/${id}/medical`,

    plans: (id) => `/patients/${id}/treatment-plans`,
    plan: (id, planId) => `/patients/${id}/treatment-plans/${planId}`,
    /**
     * Recording consent is a POST rather than a field on the plan, because it
     * is an act with a time, an author and a method — and because it is what
     * moves the plan into treatment. A boolean a client could set alongside a
     * fee change is a checkbox, not a consent record.
     */
    planConsent: (id, planId) => `/patients/${id}/treatment-plans/${planId}/consent`,

    appointments: (id) => `/patients/${id}/appointments`,
    prescriptions: (id) => `/patients/${id}/prescriptions`,
    notes: (id) => `/patients/${id}/notes`,
    hygiene: (id) => `/patients/${id}/hygiene`,

    attachments: (id) => `/patients/${id}/attachments`,
    /**
     * Image bytes never travel through the API.
     *
     * Same three-step shape the university portal uses for radiographs, for the
     * same reason: ask for a short-lived, single-blob write capability, PUT the
     * bytes straight to storage, then post a descriptor naming the blob you
     * wrote. A radiograph is 4-20MB and a record carries a dozen; proxying that
     * through the API means paying for the bandwidth twice and holding a 20MB
     * buffer in a process sized for JSON.
     */
    attachmentUpload: (id) => `/patients/${id}/attachments/upload-url`,
    attachment: (id, attachmentId) => `/patients/${id}/attachments/${attachmentId}`,

    /**
     * Is this phone number or patient number already on file?
     *
     * A 1 RU point read against a uniqueness reservation rather than a search
     * over the roster, so the registration form can check as the desk types
     * without the page having to download the practice first. It answers with
     * the colliding patient's *id* and never their name — "that number belongs
     * to Mona Farouk" is a disclosure to whoever typed it, and the form only
     * needs enough to offer "open that record instead".
     */
    availability: "/patients/availability",
  },

  /**
   * The front desk's board — one request that replaces six list reads.
   *
   * The dashboard it serves used to render its six cards by fetching six
   * independent lists and measuring them in the browser: today's appointments
   * and the waitlist (both legitimately needed), plus *every* recall on file to
   * show six, *every* bill ever issued to filter the open ones, and *every* lab
   * case ever to find the returned ones. Three unbounded tables read in full so
   * that a `.filter().length` could produce a number four characters wide — by
   * every machine at the front of the clinic, on every window focus.
   *
   * Its own prefix rather than `/analytics/dashboard/receptionist`, for the
   * same reason the dentist's board has one: a board gated on *being* a role
   * cannot be asked for by the wrong person, where a role in the URL is a
   * parameter somebody can change.
   */
  frontDesk: {
    board: "/front-desk/board",
  },

  /**
   * The dentist's board.
   *
   * One endpoint per role rather than `/analytics/dashboard/:role`, so the role
   * is not a parameter somebody can change: a board is gated on *being* a
   * dentist, not on holding a permission four roles hold. It returns the tiles
   * and the three lists the dashboard used to fetch separately.
   */
  dentist: {
    board: "/dentist/board",
  },

  /**
   * The owner's board — the whole screen in one request.
   *
   * Eleven cards that used to be eleven reads, and against a real database that
   * is eleven round trips re-reading the same rows to fold them differently.
   * Its own prefix for the same reason the other three have one: a board gated
   * on *being* the owner cannot be asked for by anybody else, where a role in
   * the URL is a parameter.
   *
   * `range` is the only query it takes — 30, 90 or 365 — and it is a fixed set
   * rather than an arbitrary day count because each distinct value is its own
   * cache entry on the server, and an unbounded parameter turns a warm cache
   * cold for everybody.
   *
   * What makes it cheap is that none of it is computed from the underlying
   * rows. Every figure on it is folded from one small counter document per day,
   * written at ~1 RU by the handlers that moved the number — so the board costs
   * the same in the practice's tenth year as in its first month. The one
   * exception is the receivable ageing, which cannot come from a counter: a
   * bill raised in March and still unpaid in June belongs in the 90+ bucket
   * today and belonged in 0–30 when it was written.
   */
  owner: {
    board: "/owner/board",

    /**
     * The ageing again, with the bills behind it.
     *
     * The board draws four bars; this is what the owner opens when one of them
     * is the wrong size. Separate rather than a bigger board payload, because
     * the list of who owes what is the part that grows with the problem and
     * nobody needs it until they are chasing somebody.
     */
    receivables: "/owner/receivables",
  },

  appointments: {
    list: "/appointments",
    detail: (id) => `/appointments/${id}`,
    log: "/appointments/log",

    /**
     * The waitlist.
     *
     * A POST here adds somebody waiting on a cancellation; a PATCH on an entry
     * resolves it. Its own resource rather than an appointment with a null
     * date, because a waitlist entry has no slot, no chair and no time — and
     * modelling it as a booking would mean every date-ranged query in the book
     * had to remember to exclude it.
     */
    waitlist: "/appointments/waitlist",
    waitlistEntry: (id) => `/appointments/waitlist/${id}`,
  },

  treatments: {
    list: "/treatments",
    detail: (id) => `/treatments/${id}`,
  },

  finance: {
    accounts: "/finance/accounts",
    accountDetail: (id) => `/finance/accounts/${id}`,
    transactions: "/finance/transactions",
    transfer: "/finance/transfer",
    bills: "/finance/bills",
    billDetail: (id) => `/finance/bills/${id}`,
    billComments: (id) => `/finance/bills/${id}/comments`,
    payments: "/finance/payments",
    /** The day's takings split by method — what the till is counted against. */
    takings: "/finance/payments/takings",
    paymentMethods: "/finance/payment-methods",
    paymentMethod: (id) => `/finance/payment-methods/${id}`,
    purchases: "/finance/purchases",
    purchaseDetail: (id) => `/finance/purchases/${id}`,
    summary: "/finance/summary",

    /**
     * Does every account's balance match the sum of its ledger?
     *
     * The owner's month-end check, and the one endpoint in the finance surface
     * that is deliberately expensive: it reads every movement in the window,
     * which is the query the rest of the design exists to avoid. It belongs to
     * a close, and to the moment somebody disputes a figure — not to a screen
     * that runs it on load.
     *
     * It reports and does not repair. A drift is two records of the same money
     * disagreeing, and the right response is a person deciding which is true; a
     * job that silently overwrote one with the other would erase the evidence
     * of whatever caused it.
     */
    reconcile: "/finance/reconcile",
  },

  inventory: {
    stocks: "/inventory/stocks",
    stock: (id) => `/inventory/stocks/${id}`,

    /**
     * The tile numbers, as one point read.
     *
     * The stocks screen rendered "32 lines, 5 low, 6 out, £10,200 on the shelf"
     * by fetching every line and counting it in the browser — five numbers,
     * four characters wide, paid for with the whole table, growing with the
     * practice. The server keeps the tallies on one small document the writes
     * maintain; nothing here is derived from a list the client had to download.
     */
    stocksSummary: "/inventory/stocks/summary",

    /**
     * What to order, and what is about to go off.
     *
     * The expiry half is the panel that would otherwise never exist: a full
     * shelf expiring next week is not *low*, so no status filter would ever
     * surface it — and it is the failure a practice actually pays for, because
     * the item is bought, stored and then thrown away.
     */
    stocksReorder: "/inventory/stocks/reorder",

    /**
     * Chairside consumption.
     *
     * A POST against the item rather than a PATCH of its quantity, and the
     * difference is not cosmetic. It is *relative*, so two assistants consuming
     * from the same box in the same second both land instead of overwriting
     * each other; it carries `stock:consume` rather than `stock:manage`, so
     * using something is not the same permission as correcting the count; and
     * it records an appointment, which is what turns "we used 14 ampoules
     * today" into a cost-per-procedure answer and a batch-recall trace.
     */
    consumeStock: (id) => `/inventory/stocks/${id}/consume`,

    stockOrders: "/inventory/stock-orders",
    peripherals: "/inventory/peripherals",
  },

  lab: {
    cases: "/lab/cases",
    caseDetail: (id) => `/lab/cases/${id}`,

    /**
     * How many cases sit in each stage — one grouped count, four badges.
     *
     * Replaces the lab table being read in full so the board could call
     * `.filter().length` on it.
     */
    stages: "/lab/cases/stages",

    /**
     * One endpoint per act, rather than a general PATCH with a free-form body.
     *
     * Three roles share a lab case and each has exactly one verb: the dentist
     * prescribes it (POST /lab/cases), the assistant dispatches the impression,
     * and the desk chases it back. A shared PATCH would let any of them write
     * any field, and the audit trail would only be able to say that somebody
     * changed something.
     */
    dispatch: (id) => `/lab/cases/${id}/dispatch`,
    /** Log that the patient was rung about their work — see `recalls.contact`. */
    contact: (id) => `/lab/cases/${id}/contact`,
  },

  sterilization: {
    cycles: "/sterilization/cycles",

    /**
     * Read an indicator that came back later.
     *
     * A spore test sits in an incubator for up to 24 hours, so the row is
     * created pending and completed the next morning. `startedAt` travels in
     * the body because a cycle lives in its own month's partition and the
     * server needs it to build the key.
     */
    cycle: (id) => `/sterilization/cycles/${id}`,

    /**
     * The tile strip and the spore-test warning, folded server-side.
     *
     * The alternative is the screen fetching the register to count it — and the
     * sterilisation register is the one table in a practice that is never
     * pruned, because it is a legal record.
     */
    summary: "/sterilization/summary",

    /**
     * The sterilisers, for the cycle form's dropdown.
     *
     * Deliberately not `/inventory/peripherals`. The equipment register is
     * gated on `peripheral:view`, which a **dentist does not hold** — and a
     * dentist can open the sterilisation screen, because they hold
     * `sterilization:view`. Pointing the dropdown at the register 403s for
     * exactly the role most likely to be reading a cycle result, so the four
     * fields it needs are served under the permission that gates the page.
     */
    sterilizers: "/sterilization/sterilizers",
  },

  rooms: {
    list: "/rooms",

    /**
     * Turn a chair over.
     *
     * Gated on `sterilization:log` rather than a room permission, because
     * marking a room ready is an infection-control assertion — it says the
     * surfaces were wiped and the chair is fit for the next patient — so the
     * people who may make it are the people trusted to sign the register.
     */
    room: (id) => `/rooms/${id}`,
  },

  /**
   * The dental assistant's board.
   *
   * One request in place of four list reads — today's visits, every room, every
   * sterilisation cycle ever recorded, and every stock line — which the
   * dashboard used to fetch in full and count in the browser. Two of those
   * tables grow forever and the register is never pruned.
   *
   * A board per role rather than `/analytics/dashboard/:role`, and gated on the
   * role rather than a permission: every permission behind this data is held by
   * the owner and the dentist too, so a permission check would let either fetch
   * "the assistant's board". If more roles hold the permission than should see
   * the payload, the permission is not the gate.
   */
  assistant: {
    board: "/assistant/board",
  },

  recalls: {
    list: "/recalls",
    detail: (id) => `/recalls/${id}`,
    /** Status tallies for the screen's tabs, as one grouped count. */
    counts: "/recalls/counts",

    /**
     * Log that the patient was contacted.
     *
     * The endpoint the Call button was missing. Before it, pressing Call showed
     * a toast and wrote nothing — so a second receptionist rang the same person
     * an hour later, and the practice could not tell somebody who had declined
     * from somebody nobody had reached.
     *
     * Being rung deliberately does *not* move a recall out of the actionable
     * list: being rung is not being seen. The attempt count is what changes.
     */
    contact: (id) => `/recalls/${id}/contact`,
    /** The patient booked — takes them off the queue and points at the visit. */
    booked: (id) => `/recalls/${id}/booked`,
  },

  analytics: {
    dashboard: (role) => `/analytics/dashboard/${role}`,
    report: "/analytics/report",
  },

  audit: {
    list: "/audit",
  },

  support: {
    threads: "/support/threads",
    articles: "/support/articles",
  },

  /**
   * University portal — the teaching-clinic surface.
   *
   * Scoped under `/university` so a tenant's student-clinic data never shares a
   * route with a private practice's PMS data, even by accident.
   */
  university: {
    campus: "/university/campus",

    /**
     * The console's two tenant directories.
     *
     * Under `/platform`, not `/university`, and that is the correction rather
     * than a preference: these are screens about *every* tenant, and the
     * university router's first act is to pin every query to one campus. They
     * sat here because the pages that read them live inside the university
     * shell's URL space, which is a routing detail of the client and was never
     * a fact about the data.
     */
    campuses: "/platform/tenants/campuses",
    partnerClinics: "/platform/tenants/clinics",

    cases: "/university/cases",
    caseDetail: (id) => `/university/cases/${id}`,

    /**
     * The clinic desk's counters, in one read.
     *
     * The desk board asks five questions — how many booked today, how many
     * waiting, how many cases still need a student, how many requests are
     * pending, how many patients are on file — and answering them by fetching
     * five lists and counting them in the browser costs the campus's whole
     * case table on every dashboard open. The server keeps the tallies and
     * returns them; nothing here is derived from a list the client holds.
     */
    deskSummary: "/university/desk/summary",

    /**
     * Is this national ID or serial number already on file?
     *
     * The registry form used to answer this by holding every patient in the
     * campus in memory and searching the array. It is one key read on the
     * server — the same reservation record that makes the collision atomic at
     * registration time — so the form can check as the desk types without the
     * page having to know the whole clinic first.
     */
    registryAvailability: "/university/registry/availability",

    /**
     * A patient card, read from the token in its QR.
     *
     * Unauthenticated — the people who scan a card do not have accounts —
     * and therefore the narrowest projection in the university surface.
     */
    sharedCard: (token) => `/university/cards/${token}`,

    /**
     * Students a case can be allocated to, ranked by who still needs one.
     *
     * Replaces "fetch every student, fetch every appointment on the day, join
     * them in the browser". `department` decides which quota is counted and
     * `date` decides the same-day chair load, both of which the server already
     * knows and neither of which the client should be paging through to learn.
     */
    allocatableStudents: "/university/students/allocatable",
    caseChart: (id) => `/university/cases/${id}/chart`,
    caseSheets: (id) => `/university/cases/${id}/sheets`,
    caseSheet: (id, sheetId) => `/university/cases/${id}/sheets/${sheetId}`,
    caseTimeline: (id) => `/university/cases/${id}/timeline`,
    caseGallery: (id) => `/university/cases/${id}/gallery`,
    caseGalleryItem: (id, imageId) => `/university/cases/${id}/gallery/${imageId}`,
    caseXrays: (id) => `/university/cases/${id}/xrays`,
    caseXray: (id, xrayId) => `/university/cases/${id}/xrays/${xrayId}`,

    /**
     * Image bytes never travel through the API.
     *
     * The client asks for a short-lived, single-blob write capability, PUTs
     * straight to storage, and then posts a descriptor to `caseGallery` /
     * `caseXrays` naming the blob it wrote. A radiograph is 4–20MB and a case
     * carries a dozen; proxying that through the API would mean paying for the
     * bandwidth twice and holding a 20MB buffer in a process sized for JSON.
     */
    caseMediaUpload: (id) => `/university/cases/${id}/media/upload-url`,
    /** Read capabilities expire on purpose; a long-open gallery re-asks. */
    caseMediaReadUrls: (id) => `/university/cases/${id}/media/read-urls`,
    caseAppointments: (id) => `/university/cases/${id}/appointments`,
    caseConsent: (id) => `/university/cases/${id}/consent`,
    caseAssign: (id) => `/university/cases/${id}/assign`,

    /**
     * The patient record addressed by the number on the patient's card. The
     * student clinic works this way round: a student reads the card, not an
     * internal case id.
     */
    patientRecord: (nationalId) => `/university/patients/${nationalId}`,

    /**
     * Everything one patient has generated, assembled server-side.
     *
     * A supervisor reads a record they did not write, so they need the whole
     * of it — charts, sheets, submissions, imaging, schedule, lab, consent —
     * in one read rather than eight. Read-only by contract.
     */
    patientDossier: (nationalId) => `/university/patients/${nationalId}/dossier`,

    reviews: "/university/reviews",
    reviewDetail: (id) => `/university/reviews/${id}`,
    reviewDecision: (id) => `/university/reviews/${id}/decision`,
    /** The step checklist a procedure is signed off against. */
    reviewSteps: (procedureType) => `/university/reviews/steps/${encodeURIComponent(procedureType)}`,

    /**
     * The signature a supervisor signs a step off with. Held against the
     * signed-in supervisor, not passed per decision, so it can never be
     * attributed to the wrong person by a client bug.
     */
    signature: "/university/signature",

    students: "/university/students",
    studentDetail: (id) => `/university/students/${id}`,
    /** Cohort scoreboard — scores and grade bands, computed server-side. */
    studentScores: "/university/students/scores",
    studentScorecard: (id) => `/university/students/${id}/scorecard`,
    requirements: "/university/requirements",
    activity: "/university/activity",

    appointments: "/university/appointments",
    appointmentDetail: (id) => `/university/appointments/${id}`,
    sessions: "/university/sessions",
    /** The published weekly rotation timetable — read-only for a student. */
    sessionSchedule: "/university/session-schedule",

    procedureRequests: "/university/procedure-requests",
    procedureRequestDecision: (id) => `/university/procedure-requests/${id}/decision`,

    labRequests: "/university/lab-requests",
    labRequestDecision: (id) => `/university/lab-requests/${id}/decision`,

    /**
     * The Dean's landing board, in one request.
     *
     * The screen this replaces asked seven questions — every case, every
     * student, every review, today's appointments, the activity trail, the
     * announcements and a dashboard aggregate — and counted the answers in the
     * browser. Three of those are tables that grow with the clinic, read in
     * full so a tile could show their length. The server keeps the tallies and
     * folds the series at write time; nothing here is derived from a list the
     * client holds.
     */
    deanBoard: "/university/dean/board",

    people: "/university/people",
    personDetail: (id) => `/university/people/${id}`,
    accounts: "/university/accounts",
    accountDetail: (id) => `/university/accounts/${id}`,
    bulkCreate: "/university/accounts/bulk",

    /**
     * The IT tile strip, as one counter read.
     *
     * The dashboard and the accounts screen used to render "142 accounts, 3
     * locked, 9 on a temporary password" by fetching every login on the campus
     * and calling `.filter().length` four times. The server keeps the tallies;
     * nothing here is derived from a list the client had to download first.
     */
    accountsSummary: "/university/accounts/summary",

    /**
     * Issue a first credential — a temporary password, or an invitation link.
     *
     * A POST rather than a PATCH because it mints something: the value comes
     * back exactly once, in a `no-store` response, and is not retrievable
     * afterwards by any endpoint. Every live session on the account ends with
     * it, which is the point rather than a side effect.
     */
    accountCredential: (id) => `/university/accounts/${id}/credential`,

    /**
     * Cohort import from a CSV the browser puts straight into blob storage.
     *
     * Same three-step shape as the radiographs, for the same reasons: ask for a
     * short-lived, single-blob write capability, PUT the bytes to storage
     * directly, then name the blob you wrote. A term's intake is a 4 MB file
     * that has no business passing through an API sized for JSON — and the
     * result report comes back the same way, as a private URL rather than two
     * hundred credentials in a response body.
     */
    accountImportUrl: "/university/accounts/import/upload-url",
    accountImport: "/university/accounts/import",

    news: "/university/news",
    newsDetail: (id) => `/university/news/${id}`,

    analytics: (role) => `/university/analytics/${role}`,
    reports: "/university/reports",
  },

  /**
   * Odenta's own console — above every tenant.
   *
   * Scoped under `/platform` rather than under `/university` because the server
   * mounts it as a sibling: the university surface pins every query to one
   * campus, and this one exists to read across them. Keeping the two prefixes
   * apart is what makes "is this request tenant-scoped" a property of the URL
   * rather than something you have to check per handler.
   */
  platform: {
    /** The whole board in one read — see `routes/platform/overview.js`. */
    overview: "/platform",

    tenants: "/platform/tenants",
    tenant: (tenantId) => `/platform/tenants/${tenantId}`,
    tenantStatus: (tenantId) => `/platform/tenants/${tenantId}/status`,
    plans: "/platform/tenants/plans",

    accounts: "/platform/accounts",
    accountsSummary: "/platform/accounts/summary",
    account: (userId) => `/platform/accounts/${userId}`,
    accountStatus: (userId) => `/platform/accounts/${userId}/status`,
    accountUnlock: (userId) => `/platform/accounts/${userId}/unlock`,
    accountRole: (userId) => `/platform/accounts/${userId}/role`,
    accountReset: (userId) => `/platform/accounts/${userId}/reset`,
    /**
     * Issue a *new* first credential — distinct from `accountReset`, which
     * flags an account and mints nothing. This one is for "cannot get in";
     * that one is for "may be compromised".
     */
    accountCredential: (userId) => `/platform/accounts/${userId}/credential`,

    /**
     * The development role switcher. **Absent in production** — the server does
     * not mount `routes/platform/devSignIn.js` when NODE_ENV is production, so
     * both of these 404 there and the dashboard card falls back to preview-only.
     */
    devSignIn: "/platform/dev/sign-in",
    devSignInTargets: "/platform/dev/sign-in/targets",
    accountSessions: (userId) => `/platform/accounts/${userId}/sessions`,
    accountMfa: (userId) => `/platform/accounts/${userId}/mfa`,
    accountsBulk: "/platform/accounts/bulk",

    analytics: "/platform/analytics",

    /** The full operator trail, and the quarter-bounded export. */
    activity: "/platform/activity",
    activityExport: "/platform/activity/export",

    securityEvents: "/platform/security/events",
    securityEvent: (eventId) => `/platform/security/events/${eventId}`,
    securityEventStatus: (eventId) => `/platform/security/events/${eventId}/status`,
    securitySummary: "/platform/security/summary",
    alerts: "/platform/security/alerts",
    alertAcknowledge: (alertId) => `/platform/security/alerts/${alertId}/acknowledge`,
    alert: (alertId) => `/platform/security/alerts/${alertId}`,

    servers: "/platform/servers",
    serverLoad: "/platform/servers/load",
    serverCost: "/platform/servers/cost",
    serverState: (nodeId) => `/platform/servers/${nodeId}/state`,
    cache: "/platform/servers/cache",
    cacheFlush: "/platform/servers/cache/flush",

    billingSummary: "/platform/billing/summary",
    subscription: (tenantId) => `/platform/billing/subscriptions/${tenantId}`,
    invoices: "/platform/billing/invoices",
    invoice: (invoiceId) => `/platform/billing/invoices/${invoiceId}`,
    invoiceStatus: (invoiceId) => `/platform/billing/invoices/${invoiceId}/status`,
    invoiceDraft: (tenantId) => `/platform/billing/invoices/draft/${tenantId}`,
    payments: "/platform/billing/payments",

    settings: "/platform/settings",
    setting: (key) => `/platform/settings/${key}`,
    roles: "/platform/settings/roles",
    role: (roleKey) => `/platform/settings/roles/${roleKey}`,

    /**
     * Read-only preview of a tenant's portal.
     *
     * The token comes back in the response body of an authenticated request and
     * is never put in a URL, so it cannot leak through history, a referrer or
     * an access log.
     */
    previewTargets: "/platform/preview/targets",
    previewSession: "/platform/preview/session",
  },

  /* Public marketing site — the only endpoints served to anonymous callers. */
  site: {
    universities: "/site/universities",
    university: (id) => `/site/universities/${id}`,
    partnerClinics: "/site/clinics",
    testimonials: "/site/testimonials",
    contact: "/site/contact",
    demoRequest: "/site/demo-request",
    newsletter: "/site/newsletter",
    aiAnalysis: "/site/ai/analyse",
    bookingSlots: "/site/booking/slots",
    bookings: "/site/booking",
    booking: (reference) => `/site/booking/${reference}`,
  },
};
