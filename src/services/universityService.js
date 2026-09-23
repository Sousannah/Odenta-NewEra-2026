import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

/**
 * University-portal verbs.
 *
 * Named after what a person in the teaching clinic actually does — a student
 * *submits a step*, a supervisor *decides* one, the desk *allocates a case* —
 * rather than after the HTTP shape underneath. Screens import from here and
 * never from `@/api`.
 */

/* ------------------------------------------------------------- the campus */

export const getCampus = () => api.get(endpoints.university.campus);
export const getCampuses = () => api.get(endpoints.university.campuses);
export const getPartnerClinics = () => api.get(endpoints.university.partnerClinics);

/* -------------------------------------------------------------- caseload */

/**
 * `params.studentId` scopes the list to one student's caseload. The server is
 * expected to derive it from the session for a student role and ignore what
 * the client sent — this parameter is for supervisors and the desk.
 */
export const getCases = (params) => api.get(endpoints.university.cases, params);

/**
 * One page of the registry, filtered, searched and counted on the server.
 *
 * The same endpoint as `getCases`, asked a different way: passing `page` opts
 * into a paged envelope — `{ items, total, page, pageSize, pageCount }` —
 * instead of the whole list.
 *
 * This is the difference between a desk screen that reads fifteen rows and one
 * that reads every patient the campus has ever registered in order to show
 * fifteen of them. Filtering and searching move with it, because a filter
 * applied after the read has already cost the full read.
 */
export const getCasesPage = (params) =>
  api.get(endpoints.university.cases, { page: 1, pageSize: 15, ...params });

export const getCase = (id) => api.get(endpoints.university.caseDetail(id));
export const createCase = (payload) => api.post(endpoints.university.cases, payload);
export const updateCase = (id, payload) => api.patch(endpoints.university.caseDetail(id), payload);

/**
 * Withdraw a registration. Refused once the record has clinical work against
 * it — a chart or a submitted step is part of a teaching record and is
 * archived, not deleted.
 */
export const deleteCase = (id) => api.delete(endpoints.university.caseDetail(id));

/** Allocate an unassigned case to a student. Grants them access to the record. */
export const assignCase = (id, { studentId, department }) =>
  api.post(endpoints.university.caseAssign(id), { studentId, department });

export const getCaseChart = (id) => api.get(endpoints.university.caseChart(id));
/**
 * Save a case's tooth chart. `document` is `{ odontogram, chart }` — the chart's
 * own payload plus the flat entry list derived from it (see
 * `src/odontogram/adapter.js`). An array is still accepted so a caller that
 * only has entries keeps working.
 */
export const saveCaseChart = (id, document) =>
  api.put(
    endpoints.university.caseChart(id),
    Array.isArray(document) ? { chart: document } : document
  );

export const getCaseSheets = (id) => api.get(endpoints.university.caseSheets(id));
export const createCaseSheet = (id, payload) => api.post(endpoints.university.caseSheets(id), payload);
export const saveCaseSheet = (id, sheetId, payload) =>
  api.put(endpoints.university.caseSheet(id, sheetId), payload);

export const getCaseGallery = (id) => api.get(endpoints.university.caseGallery(id));
export const addCaseGallery = (id, items) =>
  api.post(endpoints.university.caseGallery(id), { items });
export const annotateCaseGallery = (id, imageId, note) =>
  api.patch(endpoints.university.caseGalleryItem(id, imageId), { note });
export const removeCaseGallery = (id, imageId) =>
  api.delete(endpoints.university.caseGalleryItem(id, imageId));

/**
 * Radiographs are a separate list from the clinical photo gallery.
 *
 * They are read under different rules — a radiograph carries a dose record and
 * is retained for years — so keeping them apart here saves splitting them
 * later.
 */
export const getCaseXrays = (id) => api.get(endpoints.university.caseXrays(id));
export const addCaseXrays = (id, items) => api.post(endpoints.university.caseXrays(id), { items });
export const annotateCaseXray = (id, xrayId, note) =>
  api.patch(endpoints.university.caseXray(id, xrayId), { note });
export const removeCaseXray = (id, xrayId) =>
  api.delete(endpoints.university.caseXray(id, xrayId));

/* ----------------------------------------------------------------- media */

/**
 * Ask for permission to upload, rather than uploading.
 *
 * Resolves with one entry per file — `{ fileId, path, uploadUrl, headers }`.
 * The caller PUTs the bytes to `uploadUrl` itself and then posts the returned
 * `path` to `addCaseGallery` / `addCaseXrays`. Splitting it this way is what
 * keeps image bytes off the API entirely: the URL is scoped to one blob, is
 * create-only, and expires in minutes.
 *
 * `files` is `[{ name, contentType, sizeBytes, kind }]`. The server refuses a
 * type or a size it will not store *before* anything is transferred, so a
 * rejected file costs the student a round trip rather than an upload.
 */
export const requestMediaUpload = (caseId, files) =>
  api.post(endpoints.university.caseMediaUpload(caseId), { files });

/**
 * Fresh read URLs for blobs whose signature has expired.
 *
 * A gallery left open outlives its URLs by design — a capability that lasted
 * all day would be one a screenshot could share all day. `paths` is the list to
 * re-sign; the response maps each path to a new URL.
 */
export const refreshMediaUrls = (caseId, paths) =>
  api.post(endpoints.university.caseMediaReadUrls(caseId), { paths });

export const getCaseTimeline = (id) => api.get(endpoints.university.caseTimeline(id));

/** Every visit booked against one case, past and future. */
export const getCaseAppointments = (id) => api.get(endpoints.university.caseAppointments(id));
export const bookCaseAppointment = (id, payload) =>
  api.post(endpoints.university.caseAppointments(id), payload);
export const cancelCaseAppointment = (id, appointmentId) =>
  api.delete(`${endpoints.university.caseAppointments(id)}/${appointmentId}`);

/**
 * The patient record as a student addresses it — by the national id printed on
 * the patient's card rather than by an internal case id.
 */
export const getPatientRecord = (nationalId) =>
  api.get(endpoints.university.patientRecord(nationalId));
export const updatePatientRecord = (nationalId, payload) =>
  api.patch(endpoints.university.patientRecord(nationalId), payload);

/**
 * The whole of one patient, for someone who did not write any of it.
 *
 * A supervisor opening a record has no working context to fall back on — they
 * need the charts, the sheets, every submission and its step verdicts, the
 * imaging, the schedule, the lab work and the consent in one read, plus a
 * timeline that says who did what and when. Strictly read-only.
 */
export const getPatientDossier = (nationalId) =>
  api.get(endpoints.university.patientDossier(nationalId));

/** Capture consent. Nothing in the case can be submitted for review before this. */
export const signConsent = (id, payload) =>
  api.post(endpoints.university.caseConsent(id), { signed: true, ...payload });

/* ------------------------------------------------------------- the reviews */

export const getReviews = (params) => api.get(endpoints.university.reviews, params);
export const getReview = (id) => api.get(endpoints.university.reviewDetail(id));

/** Student → supervisor. Rejected with `consent_required` if consent is missing. */
export const submitStep = (payload) => api.post(endpoints.university.reviews, payload);

/**
 * The step checklist for a procedure.
 *
 * A teaching convention that varies by faculty, so it is fetched rather than
 * hardcoded in the screen. `subType` narrows it where one procedure is taught
 * as two distinct sequences (a crown and a bridge are not the same steps).
 */
export const getReviewSteps = (procedureType, subType) =>
  api.get(endpoints.university.reviewSteps(procedureType), subType ? { subType } : undefined);

/**
 * Supervisor → student. `status` is one of accepted | returned | rejected;
 * anything but `accepted` requires a comment.
 */
export const decideReview = (id, payload) =>
  api.post(endpoints.university.reviewDecision(id), payload);

/**
 * The supervisor's own sign-off signature.
 *
 * Scoped to the session on the server: a supervisor can read and replace their
 * own and nobody else's, which is the only thing that makes a signed step mean
 * anything.
 */
export const getSignature = () => api.get(endpoints.university.signature);
export const saveSignature = (signature) =>
  api.post(endpoints.university.signature, { signature });

/* ----------------------------------------------------------- the students */

export const getStudents = (params) => api.get(endpoints.university.students, params);

/**
 * The cohort scoreboard.
 *
 * Scores are computed on the server from submitted work and faculty decisions,
 * never in the client — two screens must never be able to disagree about who
 * is failing. `range` narrows the window; `target` is the submission count
 * that counts as a full clinical load for the volume component.
 */
export const getStudentScores = (params) => api.get(endpoints.university.studentScores, params);
export const getStudentScorecard = (id, params) =>
  api.get(endpoints.university.studentScorecard(id), params);
/**
 * Who this case should go to.
 *
 * The desk allocating a case is answering one question — *who still needs one
 * of these, and who is not already full today* — and both halves of it are
 * server-side facts. `department` decides which quota is counted; `date`
 * decides the chair load. Rows come back ranked, so the screen renders the
 * order it is given rather than sorting a cohort it had to download first.
 */
export const getAllocatableStudents = (params) =>
  api.get(endpoints.university.allocatableStudents, params);

export const getStudent = (id) => api.get(endpoints.university.studentDetail(id));
export const updateStudent = (id, payload) =>
  api.patch(endpoints.university.studentDetail(id), payload);

export const getRequirements = (params) => api.get(endpoints.university.requirements, params);

export const getActivity = (params) => api.get(endpoints.university.activity, params);

/**
 * One page of the activity trail, plus where to resume.
 *
 * Resolves `{ data, continuation }`. The trail is the one list in the portal
 * that has no natural end, and the server walks it backwards one day-partition
 * at a time — so "load more" costs a page rather than a re-read of everything
 * already on screen. Pass the previous `continuation` back as `cursor`.
 *
 * `since` is a day (`YYYY-MM-DD`), not a timestamp: it selects which partitions
 * the walk is allowed to touch, so it is a bound on the work rather than a
 * filter applied after it.
 */
export const getActivityPage = (params) =>
  api.getPage(endpoints.university.activity, params);

/**
 * One page of the trail **plus the numbers that describe the window**.
 *
 * Resolves `{ items, continuation, stats, series }`. The tiles and the by-day
 * chart are folded server-side over the whole filter the user chose, which is
 * the difference between "412 events this week" and "the 412 we happened to
 * send you" — the second is what a screen counting its own rows can honestly
 * claim, and it is not what anybody reads it as.
 *
 * `since`/`until` are ISO instants, not dates, so "last 24 hours" is 24 hours
 * rather than two calendar days rounded outwards.
 */
export const getActivityBoard = (params) =>
  api.get(endpoints.university.activity, { ...params, stats: "1" });

/* -------------------------------------------------------- clinic sessions */

/**
 * A patient card by its share token — the read behind the QR.
 *
 * No session required and none sent; the token is the credential. Callers
 * are the public card screen only.
 */
export const getSharedCard = (token) => api.get(endpoints.university.sharedCard(token));

export const getAppointments = (params) => api.get(endpoints.university.appointments, params);

/**
 * One page of the visit list, plus the tallies the screen's stat cards show.
 *
 * `stats` is counted server-side over the *whole* filtered set, not over the
 * page — "42 booked, 9 not yet arrived" has to be true of the filter, not of
 * the fifteen rows on screen. Returning it with the page is what stops the
 * client fetching the entire range a second time to count it.
 */
export const getAppointmentsPage = (params) =>
  api.get(endpoints.university.appointments, { page: 1, pageSize: 15, ...params });

/**
 * The desk's board in one read.
 *
 * `date` defaults to today on the server. Everything in the response is a
 * counter the server maintains as visits and cases move, so opening the
 * dashboard costs a handful of key reads rather than five table scans.
 */
export const getDeskSummary = (params) => api.get(endpoints.university.deskSummary, params);

/**
 * Whether an identity number is free, before the desk commits to it.
 *
 * Advisory only. The authority is the 409 the server returns at registration —
 * two people at two desks can both be told a number is free in the same second,
 * and only one of them can have it. This exists so the common case is caught
 * while the desk is still typing, not so the check can be trusted.
 *
 * @param {{nationalId?: string, serialNumber?: string}} params
 */
export const checkRegistryAvailability = (params) =>
  api.get(endpoints.university.registryAvailability, params);

export const createAppointment = (payload) => api.post(endpoints.university.appointments, payload);
export const updateAppointment = (id, payload) =>
  api.patch(endpoints.university.appointmentDetail(id), payload);
export const getSessions = () => api.get(endpoints.university.sessions);

/**
 * The published weekly timetable: which rotation runs in which clinic on which
 * day, plus any dated cancellation inside the window. `studentId` scopes it to
 * the year and group the student is enrolled in; the server is expected to
 * derive that from the session and ignore what the client sends.
 */
export const getSessionSchedule = (params) =>
  api.get(endpoints.university.sessionSchedule, params);

/* -------------------------------------------------------------- requests */

export const getProcedureRequests = (params) =>
  api.get(endpoints.university.procedureRequests, params);
export const raiseProcedureRequest = (payload) =>
  api.post(endpoints.university.procedureRequests, payload);
export const decideProcedureRequest = (id, payload) =>
  api.post(endpoints.university.procedureRequestDecision(id), payload);

export const getLabRequests = (params) => api.get(endpoints.university.labRequests, params);
export const raiseLabRequest = (payload) => api.post(endpoints.university.labRequests, payload);
export const decideLabRequest = (id, payload) =>
  api.post(endpoints.university.labRequestDecision(id), payload);

/* -------------------------------------------------------- administration */

export const getPeople = (params) => api.get(endpoints.university.people, params);

/** One person, whichever roster they are on — student, faculty or staff. */
export const getPerson = (id) => api.get(endpoints.university.personDetail(id));

/**
 * Amend a person's roster record.
 *
 * Contact details, title, department, group, supervisor and standing. The
 * server decides which of those the person's own roster actually accepts and
 * ignores the rest, so a screen does not have to know that a student has a
 * group and a member of faculty has a department.
 *
 * Deliberately not a way to change a tally. `progress`, `acceptedSteps` and
 * `averageScore` are folds over accepted work and are refused server-side — a
 * settable progress ring is a number somebody typed.
 */
export const updatePerson = (id, payload) =>
  api.patch(endpoints.university.personDetail(id), payload);

export const getAccounts = (params) => api.get(endpoints.university.accounts, params);

/**
 * One page of the accounts list, plus where to resume.
 *
 * The continuation token, not a page number: Cosmos bills for every row an
 * OFFSET skips, so page 40 of an offset-paged list costs forty pages. The
 * screen asks for "the next fifteen" and is handed a token to ask again with.
 */
export const getAccountsPage = (params) =>
  api.getPage(endpoints.university.accounts, { limit: 25, ...params });

/**
 * The tile strip, and the role mix behind the donut.
 *
 * Counted on the server and served as one point read. This replaces the worst
 * read on the IT surface: the dashboard used to fetch *every account on the
 * campus* so it could call `.filter().length` four times, which on a
 * five-thousand-student campus is three megabytes of JSON to render four
 * numbers that are four characters wide.
 *
 * Because the tallies come from here rather than from the visible rows, they
 * describe the whole campus rather than the page — which is what an IT
 * administrator reads them as.
 */
export const getAccountSummary = () => api.get(endpoints.university.accountsSummary);

export const getAccount = (id) => api.get(endpoints.university.accountDetail(id));

/**
 * Lock, unlock, re-role, require MFA, flag a reset.
 *
 * An allowlist on the server, so a payload carrying `passwordHash`, `campusId`
 * or `permissions` changes nothing. Locking and re-roling both end every
 * session the account holds — a suspension that leaves a live token takes
 * fifteen minutes to bite, and fifteen minutes is exactly the window that
 * matters when the reason for it is that somebody else is signed in.
 */
export const updateAccount = (id, payload) =>
  api.patch(endpoints.university.accountDetail(id), payload);

/**
 * Create one account: the login, the person, and the directory row.
 *
 * `credentialMode` is `temporary` (a generated password, shown once) or
 * `invite` (a single-use link, no password stored at all). Resolves with
 * `{ account, credential }` — and the credential is the only time that value
 * exists outside the person's head, so the screen has to show it before it
 * navigates.
 */
export const createAccount = (payload) => api.post(endpoints.university.accounts, payload);

/**
 * Issue a fresh credential for an existing account.
 *
 * Ends every live session, which is the point: the reason an administrator
 * resets a credential is almost always that the old one is compromised.
 */
export const resetAccountCredential = (id, mode = "temporary") =>
  api.post(endpoints.university.accountCredential(id), { mode });

/**
 * Archive an account. There is no hard delete, on purpose.
 *
 * A student's submitted steps name their author and a supervisor's sign-off
 * carries their signature — both are teaching records an examination board may
 * read years later. Removing the login would leave those pointing at nothing,
 * so it is disabled and its student number stays reserved.
 */
export const disableAccount = (id) => api.delete(endpoints.university.accountDetail(id));

/**
 * Bulk account creation from a pasted cohort.
 *
 * `rows` is `[{ name, email, reference? }]`. Resolves with per-row outcomes —
 * created / skipped / rejected — rather than throwing on the first bad line, so
 * the screen can show exactly which three lines need fixing. Capped server-side
 * at 200 rows, because each one may cost a deliberately expensive password hash;
 * larger cohorts go through the CSV path below.
 */
export const bulkCreateAccounts = (rows, options = {}) =>
  api.post(endpoints.university.bulkCreate, { rows, ...options });

/**
 * Ask for permission to upload a cohort file, rather than uploading it.
 *
 * Resolves with `{ path, uploadUrl, headers }`. The caller PUTs the file to
 * `uploadUrl` itself and then posts the returned `path` to `importAccounts`.
 * Splitting it this way keeps a 4 MB export off the API entirely — the URL is
 * scoped to one blob, is create-only, and expires in minutes. The server
 * refuses a type or a size it will not accept *before* anything is transferred.
 */
const requestCohortUpload = (file) =>
  api.post(endpoints.university.accountImportUrl, {
    fileName: file.name,
    contentType: file.type || "text/csv",
    sizeBytes: file.size,
  });

/**
 * Import the cohort from a blob this campus uploaded.
 *
 * `dryRun` parses and reports without creating anything, which is what the
 * preview pass uses. A real run creates up to 200 rows and says how many are
 * `remaining`, so a three-thousand-row intake is a sequence of calls rather
 * than one request that holds a connection for two minutes and cannot be
 * resumed if it drops. Re-importing is safe: an address that already has an
 * account is skipped, not duplicated.
 */
export const importAccounts = (payload) =>
  api.post(endpoints.university.accountImport, payload);

/**
 * Upload a cohort file and import it, as the screen actually does it.
 *
 * The raw PUT deliberately does not go through `api`: it is a request to Azure
 * Storage, not to us, and attaching our bearer token or CSRF header to it would
 * be sending our credentials to a third party.
 */
export async function uploadCohortFile(file) {
  const capability = await requestCohortUpload(file);

  /**
   * Straight to Azure, deliberately not through `api`.
   *
   * This is a request to storage, not to us. Attaching our bearer token or our
   * CSRF header to it would be sending our credentials to a third party — the
   * SAS in the URL is the only authority it needs, and it is scoped to this one
   * blob for the next few minutes.
   */
  const response = await fetch(capability.uploadUrl, {
    method: "PUT",
    headers: capability.headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error(
      `The file could not be uploaded (${response.status}). The link may have expired — try again.`
    );
  }

  return capability;
}

export const getNews = (params) => api.get(endpoints.university.news, params);
export const publishNews = (payload) => api.post(endpoints.university.news, payload);
export const updateNews = (id, payload) => api.patch(endpoints.university.newsDetail(id), payload);

/* ------------------------------------------------------------ analytics */

/**
 * The Dean's whole landing screen, in one request.
 *
 * Counts, both time series, the rotation load, the at-risk cohort, the latest
 * announcements and the recent activity strip — folded server-side from
 * counters and write-time rollups, so the cost does not move when the campus
 * grows. `getDashboard(ROLES.UNI_ADMIN)` returns the identical payload; this is
 * the name that says what it is.
 */
export const getDeanBoard = () => api.get(endpoints.university.deanBoard);

export const getDashboard = (role) => api.get(endpoints.university.analytics(role));
export const getReport = (params) => api.get(endpoints.university.reports, params);
