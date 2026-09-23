# Architecture

How this codebase is put together, and why — written for whoever builds the
backend against it.

## Three roots

```
  /                 SiteLayout        public marketing site + booking (anonymous)
  /sign-in          SignInPage
  /app              AppLayout         clinic portal      (RequireAuth)
  /university-portal UniversityLayout university portal  (RequireAuth)
```

`src/config/paths.js` is the single source for every URL, including each role's
dashboard. `APP_BASE` / `UNI_BASE` move a whole portal; nothing else changes.

The public site calls `siteService` only, and every one of its endpoints
(`/site/*` in `src/api/endpoints.js`) must be reachable without a session —
including `/site/booking*`, which is how a member of the public books a chair in
a university clinic. The rest of the surface stays behind auth.

### Why two portals rather than one with a flag

A private practice and a dental school share the design system and the clinical
primitives (odontogram, perio chart, FDI notation) and almost nothing else. The
school has a caseload allocated to a student, a supervisor who signs each step,
and a rotation quota; the practice has bills, chairs and a rota. Modelling that
as one portal with `if (isUniversity)` would put those two vocabularies in the
same components, so they are deliberately siblings:

| | clinic | university |
| --- | --- | --- |
| layout | `layouts/AppLayout` | `university/layout/UniversityLayout` |
| nav registry | `config/navigation.js` | `config/universityNavigation.js` |
| permissions | `P` in `auth/permissions.js` | `UP` in the same file |
| services | `patientService`, `financeService`, … | `universityService` |
| tenant on the session | `clinic` | `campus` |

`ROLE_META[role].portal` is what decides which shell a login lands in;
`rolesInPortalOf()` keeps a role switcher from crossing between them.

## Theme

`tailwind.config.js` holds the palette for anything addressed by class name;
`src/theme/tokens.js` holds the same values for anything that cannot be
(SVG fills, Recharts props, inline gradients). They must be changed together.
No component carries a hex.

## The tooth chart

`src/odontogram/` is one charting surface for the whole product — the dentist's
patient record, the student's case, the university case tab, the supervisor's
dossier, the chairside checkup. It wraps a vendored third-party module:

```
  src/odontogram/
    lib/              React Advanced Odontogram, vendored verbatim
    ToothChart.jsx    the component every screen imports
    adapter.js        payload → Odenta chart entries
    theme.js          Odenta palette in the module's themeConfig shape
    odenta-skin.css   what a palette alone cannot reach
    config.js         which locales the language menu offers
```

Three things are worth knowing before touching it:

- **`lib/` is a drop-in.** Re-vendoring a newer release is a folder replace plus
  four integration edits, each marked `Odenta:` at the site and listed in
  `src/odontogram/index.js`. Everything Odenta-specific lives outside `lib/`.
- **The engine is a singleton.** `initOdontogram()` wires one live chart to the
  DOM, so one `ToothChart` may be mounted at a time. Screens that could show two
  (the schedule drawer's record panel and its checkup modal) close one to open
  the other; `ToothChart` warns in development if this is violated.
- **Twelve languages are translated, two are offered.** `VISIBLE_LANGUAGES` in
  `config.js` is the whole switch — the translation table is untouched, so
  turning a locale back on is a one-line edit rather than a re-translation.

## Layering

```
  screens (roles/*, features/*)
        │  imports services only
        ▼
  services/            domain verbs: getPatients, takePayment, advanceLabCase
        │  imports api/client + api/endpoints
        ▼
  api/client.js        ONE seam.  mock driver | live driver
        │
        ├──► mock/router.js        in-memory route table (delete later)
        └──► fetch(BASE_URL + path)
```

The rule that keeps this honest: **a component may not import `@/api` or
`@/mock`.** If a screen needs data, a service verb gets added. That single rule
is what makes the backend swap a config change rather than a refactor.

## The API seam

`src/api/client.js`

- `VITE_API_MODE` = `mock` (default) or `live`.
- `setAccessToken(token)` — called by `AuthProvider` after sign-in. Swap for
  httpOnly cookies by deleting the `Authorization` header line; `credentials:
  "include"` is already set.
- `setUnauthorizedHandler(fn)` — wire this to sign-out for automatic 401
  recovery.
- Every failure becomes an `ApiError` with `status`, `code`, `details` and
  convenience getters (`isForbidden`, `isValidation`, …). Screens can branch on
  those without knowing about fetch.

`src/api/endpoints.js` is the full surface the frontend expects. It doubles as
the backend's route checklist.

## Mock router

`src/mock/router.js` registers handlers against path patterns with `:param`
segments, the way a server would:

```js
on("GET", "/patients/:id", ({ params }) => …);
on("POST", "/finance/transfer", ({ body }) => …);
```

It is stateful within a session — a transfer really moves balances, a payment
really settles a bill, a lab case really advances a stage — so flows can be
exercised end to end. Responses are `structuredClone`d so callers cannot mutate
the store by accident.

Validation lives there too (insufficient funds, same-account transfer, unknown
id), returning the same `ApiError` shapes the live driver will.

## Roles

Ten, in three families. `src/auth/roles.js` is the catalogue.

| portal | roles |
| --- | --- |
| clinic | `owner` · `dentist` · `assistant` · `receptionist` |
| university | `uni_student` · `uni_supervisor` · `uni_assistant` · `uni_admin` · `uni_it` |
| platform | `superadmin` |

The clinic side is four because that is what an Egyptian private practice has.
Three roles that a large western group practice splits out were removed rather
than left as logins nobody would create, and what each could do moved to the
role that really does it:

| removed | who does it now |
| --- | --- |
| practice manager | the owner runs the floor; the desk runs the book |
| accountant | the desk takes the money, the owner reads the books — the owner's dashboard carries the receivables ageing |
| lab technician | nobody: the lab is a **vendor**, so a lab case is a work order to an outside business. The dentist prescribes it, the assistant dispatches the impression, the desk chases it back. `labName` names the lab; there is no `technicianId`. |

`superadmin` is Odenta's own account and the only role that reaches both
portals — `ROLE_META[role].homes` gives it one landing page per shell, and
`roleHomeIn(role, portal)` is what the portal-root redirect reads. Each sidebar
carries one link across (`Platform` in the clinic footer, `Clinic Portal` in the
university Platform group), gated on a permission the other portal's roles do
not hold.

### The platform console

Ten screens under `/university-portal/platform/*`, with their own route table in
`src/config/paths.js` (`platform`) and their own service
(`src/services/platformService.js`) against the `/platform` half of the API.

```
  /platform              command centre   every tenant, account, alert and number
  /platform/tenants      tenants          sign, configure, suspend, archive
  /platform/tenants/:id  one tenant       usage, health, contract, invoices, audit
  /platform/accounts     accounts         every login, everywhere
  /platform/analytics    insights         system-wide, per tenant, against last period
  /platform/security     security         the feed, the posture, the open incidents
  /platform/servers      infrastructure   fleet, load, latency, RU cost by tenant
  /platform/billing      billing          MRR, the ledger, invoices, payments
  /platform/activity     audit trail      what Odenta did, to whom, and the export
  /platform/roles        roles            the matrix, and custom roles that narrow
  /platform/settings     settings         typed flags, defaults visible
```

Its own path table rather than more entries in `uni`, for the reason the server
mounts `/api/platform` as a sibling of `/api/university`: these screens are
*above* every tenant, and mixing them into the campus table would make "which of
these is scoped to a campus" a question you answer per route rather than per
prefix. They live inside the university shell because the founders' account has
to be able to stand in a portal and see what a tenant sees — the layout is
shared, the data boundary is not.

Three things the console will not do, each enforced by the API rather than by
the screen:

- **It never shows or sets a password.** A created account is unusable and
  flagged for reset; the credential is issued out of band.
- **It cannot open a patient record.** `superadmin` holds no clinical
  permission, in either portal. That is why the tenant preview signs in as a
  named *preview identity* belonging to the tenant rather than as a real user —
  read-only, thirty minutes, and recorded as a high-severity security event.
- **It cannot delete a tenant.** Archiving ends the contract and starts a
  retention clock; erasing a university's patient records is a runbook.

The permission catalogue for all of this is `SA` in `src/auth/permissions.js`,
split read-from-write throughout so that a future read-only operator role is a
row in the matrix rather than a refactor of every guard.

## Authorisation contract

The backend must enforce the same strings the client checks. The full catalogue
is `src/auth/permissions.js`; the matrix is `ROLE_PERMISSIONS` in the same file.

Four deliberate splits worth carrying into the API:

- `patient:view` vs `patient_clinical:view` — a receptionist may see
  demographics and take money without opening the clinical record.
- `appointment:view_all` vs `appointment:view_own` — a dentist's schedule query
  is scoped to their own chair; the desk's is not.
- clinical **read** vs clinical **write** — the assistant holds
  `patient_clinical:view` because they need allergies and premedication
  chairside, and holds no `chart:edit`, `perio:edit` or `prescription:write`.
  The one register they do own is `sterilization:log`, which is what a Ministry
  of Health inspection asks to see.
- **operate the product vs operate the practice** — `superadmin` can read every
  number in both portals and has total control of tenants, accounts, platform
  configuration and the audit trail. It holds no clinical permission at all: no
  `patient_clinical:view`, no `uni_case:view_all`, so it cannot open a patient
  record or a student dossier in either portal. It also takes no action inside a
  tenant — no `payment:take`, `account:manage`, `appointment:cancel`,
  `uni_review:decide` or `lab_case:manage`. Enforce both halves server-side;
  they are the reason a platform operator's account is safe to hold.

The session payload the client expects from `POST /auth/sign-in`:

```json
{
  "token": "…",
  "user": {
    "id": "USR-03",
    "name": "Drg Soap Mactavish",
    "firstName": "Soap",
    "email": "…",
    "role": "dentist",
    "staffId": "DNT-01",
    "title": "drg. Soap Mactavish, MM, SpKGA",
    "permissions": ["appointment:view_own", "chart:edit", "…"],
    "onboarding": { "completed": 4, "total": 4 }
  },
  "clinic": { "id": "CLN-01", "name": "Avicena Clinic", "…": "…" }
}
```

`permissions` is computed server-side. The client never derives it from the role
at runtime — it only reads what the server sent.

## Data model notes for the backend

- **Tooth identity is FDI.** Store the two-digit FDI number. Universal and Palmer
  are presentation only. Primary dentition uses quadrants 5–8.
- **A chart is two things at once.** `GET/PUT /patients/:id/chart` and
  `/university/cases/:id/chart` carry `{ odontogram, chart }`:
  - `odontogram` is the tooth chart's own payload (`{version, globals, teeth,
    case?, plan?}`) — **the chart of record**. Store it opaquely; the charting
    module owns that schema and evolves it. Do not parse or rewrite it.
  - `chart` is the flat entry list **derived** from the payload on every save
    (`src/odontogram/adapter.js`) for every screen that reads a chart without
    opening one — the supervisor dossier, the case tallies, the treatment
    planner, the per-tooth history timeline. It is a read model, never an edit
    surface: nothing writes entries back into a payload.
- **A chart entry is one fact about one tooth**, optionally scoped to surfaces.
  The two portals have two vocabularies, deliberately — clinic:
  `{ tooth, surfaces[], condition, status, code, icdas?, note, date, dentistId }`
  with `status ∈ {condition, planned, completed, existing}`; university:
  `{ tooth, surfaces[], condition, procedure, status, note, date, by }`, where
  `"N/A"` means "not recorded" because the chairside chart is a form with a
  blank rather than an absence.
- **Perio is a sparse map** `{ [tooth]: { pd: {site: mm}, rec: {…}, bleeding,
  mobility } }` over the six sites in `PERIO_SITES`. CAL is derived, not stored.
- **An appointment moves through a flow**: `registered → arrived → encounter →
  waiting → finished`, with `cancelled` and `no_show` as terminal branches
  (`APPOINTMENT_FLOW` in `config/domain.js`). Payment status is separate from
  visit status on purpose — a visit can be clinically finished and financially
  open.
- **A treatment plan gates on consent.** `consentSigned` is what the UI blocks
  progress on; the backend should treat it as a hard precondition, not a hint.
- **Money lives in accounts ("pockets").** A transfer writes two ledger rows
  with a shared `reference`, and both sides are expected in the audit log.

## The university portal

### The review loop is the spine

A student submits a **step** — one stage of one procedure on one tooth — and a
supervisor accepts, returns or rejects it. Everything else is derived from that
row:

```
  case ──> step submitted ──> supervisor decision ──> requirement tally
             (consent gate)      (comment required
                                  unless accepted)
```

Three rules the backend must enforce, because the client only mirrors them:

- **Consent gates submission.** `POST /university/reviews` rejects with
  `consent_required` when the case has no signed consent. Consent is captured by
  its own endpoint, not a field patch, so it lands in the audit log as an act.
- **A non-acceptance needs a reason.** `returned` and `rejected` without a
  comment fail with `comment_required`; a student cannot act on a bare "no".
- **Accepting is what moves a quota.** The requirement counters are updated
  server-side in the decision handler. The client never recomputes them, so two
  screens can never disagree about whether a rotation is complete.

### Scoping is the security boundary

`uni_case:view_own` vs `uni_case:view_all` is the difference between a teaching
record and a data breach. The service layer passes `studentId` / `supervisorId`
as query parameters for the convenience of supervisor and desk screens — **the
server must derive the scope from the session for a student role and ignore what
the client sent.**

Allocation (`POST /university/cases/:id/assign`) is the act that grants a student
access to a record, so it is its own endpoint with its own audit line.

### Public booking writes into the portal

`POST /site/booking` is anonymous, and it appends to the same appointment list
the clinic desk reads. That is the point: a booking made on the marketing site
must appear in the intake screen immediately, tagged `channel: "public_booking"`
so the desk knows nobody has spoken to that patient yet. Slot capacity is
re-checked at write time and returns `slot_unavailable` (409) when the hour
filled while the form was open.

### The student clinic

Every other role gets a dashboard and a handful of feature screens. A student
gets a working surface, because a student *is* the clinician: they take the
history, chart the mouth, fill the sheet, capture consent, raise the lab work
and submit each step for signature. All of that lives in `university/student`.

Two shapes, and the split matters:

```
  /university-portal/my-patients          the caseload, as people
  /university-portal/patients/:nationalId the record — a layout route
      ├── sheets  medical  history  chart  gallery  xrays
      └── appointments  consent  review-steps  lab  reviews
```

- **The record is addressed by national id**, not by case id. That is the
  number printed on the card in the patient's hand, and it is what a student
  reads off it. `GET /university/patients/:nationalId` enforces the same
  ownership scope as `/cases/:id` — looking a record up by a different key must
  not be a way around it.
- **The record is fetched once, by the layout.** The identity strip and the
  medical alert chips stay on screen through every tab, so a student mid-
  procedure never has to check which chart they are typing into.
- **Treatment sheets are append-only.** Each save posts a new sheet rather than
  editing the last, so the history reads as the treatment narrative. The five
  sheets share `sheets/SheetControls.jsx`; their option sets are the faculty's
  own, which is why they are laid out rather than collapsed into selects.
- **`caseXrays` is separate from `caseGallery`.** Radiographs carry a dose
  record and a retention period; photographs do not.

The "My Study" group — planner, performance, learning hub, profile — is gated on
`UP.REVIEW_SUBMIT` throughout. That permission means "I am the one being signed
off", which is exactly the audience; a supervisor holds `SHEET_VIEW` and
`REQUIREMENT_VIEW` and would otherwise pass a narrower-looking check.

### The faculty surface

A student works one tab of a patient at a time because they are mid-procedure.
A supervisor is doing the opposite — reconstructing what happened to a record
they did not write, usually because a submission looks wrong. That difference
is the whole design of `university/supervisor`:

```
  /university-portal/supervisor          the queue, and what is blocked on me
  /university-portal/review-queue        every submission, as cards
  /university-portal/students            the cohort scoreboard
  /university-portal/signature           the mark I sign steps off with
  /university-portal/dossier/:nationalId one patient, whole, read-only
```

- **A decision is per step, not per submission.** `ReviewDecisionModal` records
  a verdict against each step the student ticked, and accepting is blocked
  while any of them is undecided. "Returned" on its own tells a student
  nothing; the declined line names the step. The verdicts travel as
  `stepStatuses` on `POST /university/reviews/:id/decision` and the server
  normalises them to one entry per step so the student's side can index
  straight into it.
- **The signature is held against the supervisor, never sent with a decision.**
  `GET/POST /university/signature` reads and replaces the signed-in
  supervisor's own mark and nobody else's; the decision handler applies it
  server-side. A signature the client can post is a signature anyone can forge.
  Sign-offs store a reference rather than a copy, which is why the sign-off
  list renders the mark currently on file and says so.
- **`GET /university/patients/:nationalId/dossier` is one read, not eight.**
  Charts, sheets, every submission with its step verdicts, imaging, schedule,
  lab and consent, plus a timeline and the list of everyone who actually
  touched the record — not only who it is allocated to. It enforces the same
  scope as the student's record and is strictly read-only: every edit still
  goes through the endpoint that owns the row.
- **Scores are computed on the server.** `mock/db/universityScoring.js` is the
  one piece of real behaviour in the fixtures, and the file a backend has to
  reimplement. Four weighted components — acceptance, step approval,
  documentation, volume — rescaled to 100 across whichever of them have
  evidence, so an unmarked cohort does not read as a failing one; anything
  thin is flagged `provisional`. A score decides whether a student passes a
  rotation, so exactly one implementation of it may exist. The client renders
  the weights it is given so the explanation under a score cannot drift from
  the sum above it.

### The clinic desk

`university/assistant` is the front of the teaching clinic. It holds the two
screens that answer questions the caseload views cannot:

- **The registry** (`/registry`) is *everyone ever registered*, including the
  people nobody is treating yet. A student asks "what am I working on"; the
  desk asks "is this person already on file", which is why search covers every
  number a patient might read out. Registration is also the only place identity
  fields can be typed — a national ID edited after a chart exists is a chart on
  the wrong person, so the edit form locks them. `POST /university/cases`
  rejects a duplicate national id (409 `national_id_taken`) rather than letting
  two records exist for one mouth, and allocates a serial number when the desk
  leaves it blank.
- **The chair board** (`/chair-board`) is one day laid out the way the room is,
  by session and by chair. A receptionist at 8:55am is looking for the chairs
  with nobody allocated and the student who has been given four patients in one
  morning; both are invisible in a sorted table and obvious in a grid.

Withdrawing a registration (`DELETE /university/cases/:id`) refuses once a
student holds the case or anything has been submitted against it — from that
point the record is part of a teaching file and is archived, not deleted.

### Decisions carry a reason

Lab and procedure requests are both decided through a dialog that asks for a
response to the student, not a bare Approve/Reject button. A student reads a
declined procedure request mid-session and a rejected lab case the next
morning; "Declined at the desk" is not something either of them can act on.

### University data model notes

- **A case is a patient inside a teaching clinic**, not a patient record shared
  with a practice. It carries the allocated student, the supervising clinician,
  the rotation, and the consent flag.
- **A treatment sheet is `{ type, caseId, sections: { [key]: value } }`.** The
  section list per rotation lives in `SHEET_TYPES` (`config/academic.js`) — a
  teaching convention that varies by faculty, so the backend should own it
  eventually and return the same shape.
- **Requirements are a quota**, `{ department, required, completed }` per
  student. `completed` is a count of accepted steps, never a stored total.
- **Activity logs reads as well as writes.** Opening a patient record in a
  teaching clinic is itself auditable, which is why `opened_case` sits beside the
  edits in `GET /university/activity`.

## Audit

`GET /audit` is read-only from the client by design. The server is the only
party that can be trusted to record who did what, so every mutating endpoint
should write an entry: `{ at, actor, role, action, entity, detail, ip }`.
Reading a patient record is itself an auditable event.

## Component layers

| Layer | Rule |
| --- | --- |
| `components/ui` | No domain knowledge. Knows nothing about patients or bills. |
| `components/charts` | Recharts wrappers. Take data + series config, no fetching. |
| `components/dental` | Clinical widgets. Pure — findings in, events out. |
| `components/shared` | Domain-aware but screen-agnostic (`PatientAlerts`, `AppointmentList`, `DashboardShell`). |
| `roles/*` | Exactly one role's dashboard. |
| `features/*` | Screens more than one role opens; vary by permission, not by role. |
| `university/components` | University-specific widgets (review drawer, progress ring, patient card). |
| `university/roles/*` | One university role's dashboard. |
| `university/features/*` | University screens more than one role opens. |
| `university/student/*` | The student clinic — the working surface of the person doing the treatment. |
| `university/supervisor/*` | The faculty surface — the review decision, the sign-off signature, the patient dossier. |
| `university/assistant/*` | The clinic desk — registry, chair board, and the modals the desk drives a visit from. |

## Known simplifications

Called out so they are not mistaken for finished work:

- `dentalStandards.js` holds abbreviated code sets. CDT is republished annually
  and ADA-licensed; ICD-10 and the VITA shade guide are similarly trimmed here.
- Charting and perio edits are held in component state and posted on save. There
  is no optimistic-update or conflict-resolution layer yet — worth adding before
  two clinicians can chart the same patient concurrently.
- Attachments render as placeholder tiles; no upload transport is wired.
- Search and filtering happen server-side in the mock but there is no pagination
  contract yet. `DataTable` sorts client-side.
- The role switcher and the sign-in *Explore as* block are demo affordances.
  Remove both for production.
- Generated report snapshots are kept in the reader's own `localStorage`.
  A report anyone else has to see is one the server should be issuing, and
  that endpoint is what replaces `ReportBuilder`'s local store.
- Treatment sheets save whole; there is no per-section autosave and no locking,
  which matters the day a student and a supervisor open the same sheet.
- The university portal reuses the clinic `SupportPage` — support threads are
  portal-agnostic today. Split it if the two need different article sets.
- Booking slot capacity is a flat per-hour number, not a chair or supervisor
  count. A real intake desk will want it derived from staffing.
