# Architecture

How this codebase is put together, and why — written for whoever builds the
backend against it.

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

## Authorisation contract

The backend must enforce the same strings the client checks. The full catalogue
is `src/auth/permissions.js`; the matrix is `ROLE_PERMISSIONS` in the same file.

Two deliberate splits worth carrying into the API:

- `patient:view` vs `patient_clinical:view` — a receptionist may see
  demographics and take money without opening the clinical record.
- `appointment:view_all` vs `appointment:view_own` — a dentist's schedule query
  is scoped to their own chair; a manager's is not.

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
- **A chart entry is one fact about one tooth**, optionally scoped to surfaces:
  `{ tooth, surfaces[], condition, status, code, icdas?, note, date, dentistId }`
  with `status ∈ {condition, planned, completed, existing}`. This is what the
  odontogram renders and what the per-tooth history timeline groups by.
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
