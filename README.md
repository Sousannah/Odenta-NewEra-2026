# Odenta NewEra 2026 — frontend

Two halves of one product, in one Vite app:

- **The public Odenta site** at `/` — home, services, universities, clinics,
  pricing, about, contact, a live AI radiograph demo and the legal pages, in
  English and Arabic with full RTL.
- **The clinic portal** at `/app` — role-based practice management with the
  clinical model a real practice runs on: FDI charting with surfaces, six-point
  periodontal charts, CDT-coded treatment plans, consent gating, prescriptions
  with allergy checking, lab case tracking and sterilisation traceability.

Both are built from one theme — the Odenta ocean blue (`#0077B6`) into teal
(`#20B2AA`) — defined once in `tailwind.config.js` and `src/theme/`.

Frontend only. Every screen is driven by a mock API today; the real backend
plugs in behind `src/api/client.js` without touching a component.

---

## Getting started

```bash
npm install
```

```bash
npm run dev
```

<http://localhost:5180> — the public site. `/sign-in` has an **Explore as**
block so you can open any role's dashboard without a password.

```bash
npm run build
```

Stack: **React 18 · Vite 5 · React Router 6 · Tailwind CSS 3 · Recharts ·
lucide-react**. Plain JavaScript + JSX.

---

## The roles

Each role gets its own dashboard and its own slice of the app. Navigation is
filtered by permission, routes are guarded by permission, and a role dashboard
can only be opened by the role that owns it.

Four clinic roles, because that is what a practice here actually runs on — a
dentist-owner, the dentists who treat, a chairside assistant and a front desk.
There is no lab technician login: the lab is an outside business the clinic
sends work to, so a lab case is a work order to a vendor.

| Role | Home | What the dashboard answers |
| --- | --- | --- |
| Clinic Owner | `/app/owner` | Is the practice healthy? Revenue, profit, chair utilisation, what is still owed and how old it is, per-dentist and per-branch performance |
| Dentist | `/app/dentist` | Who is next, what is planned, what needs consent, which lab work is due |
| Dental Assistant | `/app/assistant` | Which room to turn, what tray to lay out, sterilisation cycles, what is running out |
| Receptionist | `/app/front-desk` | Arrivals and check-in, waitlist, recalls to chase, money to collect, what is back from the lab |
| Super Admin | `/university-portal/platform` | Every tenant at once — campuses, partner clinics, seats, storage, platform activity. The only role that reaches both portals; in the clinic portal it reads the owner's board. |

Switch between them with the **Switch role** control in the top bar (a demo
affordance — remove it and the *Explore as* block on the sign-in page for
production).

---

## Authorisation

Three files carry the whole model:

- `src/auth/roles.js` — the role list and each role's home route.
- `src/auth/permissions.js` — the permission catalogue (`resource:action`) and
  the role → permission matrix.
- `src/auth/AuthContext.jsx` — the session, plus `can()`, `useCan()` and `<Can>`.

Nothing in the UI checks a role directly; it checks a permission. Adding a role,
or moving a capability between roles, is a change to `ROLE_PERMISSIONS` only.

```jsx
const canBill = useCan(P.PAYMENT_TAKE);

<Can permission={P.STAFF_MANAGE}>
  <Button>Invite member</Button>
</Can>
```

Enforcement happens in three places:

| Layer | File | What it does |
| --- | --- | --- |
| Navigation | `src/config/navigation.js` | Filters the sidebar so a role never sees a link it cannot open |
| Route | `src/app/guards.jsx` | `RequireAuth`, `RequirePermission`, `RequireRole` |
| Affordance | `useCan` / `<Can>` | Hides buttons and menu items the role may not use |

> These are UX guards, not a security boundary. **The same permission strings
> must be enforced server-side on every request** — a client check only decides
> what to render.

---

## Project structure

```
src/
├── api/                     the swap point for the real backend
│   ├── client.js            mock | live driver, auth header, error mapping
│   ├── endpoints.js         every server path, in one place
│   └── errors.js            ApiError
├── auth/                    roles, permissions, session, sign-in screen
├── app/                     router + route guards
├── theme/                   the Odenta design tokens as values
│   ├── tokens.js            palette, gradients, chart + odontogram colours
│   └── assets.js            every shipped image, addressed by name
├── site/                    the public marketing site (routes at "/")
│   ├── layout/              SiteLayout, SiteHeader, SiteFooter
│   ├── components/          Section, Reveal, SiteButton, FeatureCard, CTABand, …
│   ├── content/             page copy as { en, ar } data — CMS-ready
│   ├── i18n/                LanguageProvider, useT, RTL switch
│   └── pages/               Home, Services, Universities, Clinics, Pricing,
│                            About, Contact, TryAI, Legal, 404
├── services/                domain services — the contract screens are written against
├── mock/                    fixtures + an in-memory router (delete later)
├── config/
│   ├── paths.js             every URL — site, auth and the /app portal
│   ├── navigation.js        permission-tagged sidebar + route permission map
│   ├── domain.js            appointment statuses, questionnaires
│   └── dentalStandards.js   CDT, ICDAS, ASA, perio staging, formulary, shades
├── components/
│   ├── ui/                  design system primitives
│   ├── charts/              Recharts wrappers
│   ├── dental/              notation, Odontogram, PerioChart
│   └── shared/              DashboardShell, PatientAlerts, AppointmentList, …
├── roles/                   one folder per role, holding that role's dashboard
│   ├── owner/  manager/  dentist/  assistant/
│   └── receptionist/  accountant/  labtech/
├── features/                screens shared across roles
│   ├── schedule/  patients/  recalls/  treatments/  staff/
│   ├── plans/     lab/       sterilisation/
│   ├── accounts/  sales/     purchases/  paymentMethods/
│   └── stocks/    peripherals/  report/  audit/  support/
├── hooks/  lib/  styles/
```

**Why `site/` is separate from everything else:** the public site shares the
theme, the API client and the service layer, and nothing else. It has its own
shell, its own navigation and its own content model, so marketing chrome can
never leak into a signed-in screen — and the site could be lifted into its own
deployment without untangling the portal.

**Why roles and features are separate:** a screen that more than one role opens
(the schedule, the patient record, the bill list) lives in `features/` and adapts
through permissions. A screen that belongs to exactly one role lives in
`roles/<role>/`. That keeps role-specific work isolated without duplicating the
shared 80%.

---

## The Odenta theme

One palette, two consumers.

| Where | File | Used by |
| --- | --- | --- |
| Class names | `tailwind.config.js` | every component (`bg-brand-600`, `text-accent-600`, `bg-od-gradient`) |
| Values | `src/theme/tokens.js` | anything that cannot take a class — SVG `fill`, Recharts colour props, inline gradients |
| Reusable classes | `src/styles/index.css` | `.od-cta`, `.od-gradient-text`, `.od-panel`, `.od-eyebrow`, `.od-container`, `.od-section` |
| Images | `src/theme/assets.js` | logo, hero and X-ray imagery, per-tooth reference plates |

`brand` is the Odenta ocean blue and `accent` the Odenta teal; the two together
make `bg-od-gradient`, the signature blue-into-teal fill on every primary CTA.
Semantic colours (`success`, `warning`, `danger`, `info`) each carry a `soft`
background and an `ink` text shade, so a status chip is
`bg-warning-soft text-warning-ink` rather than a hex.

**No component holds a hex.** Rebranding means editing the scales in
`tailwind.config.js`, mirroring them in `src/theme/tokens.js`, and nothing else:

```bash
# should return nothing outside theme/ and the mock fixtures
grep -rn "bg-\[#\|text-\[#" src --include=*.jsx
```

### The public site

`src/site/` is self-contained. Copy lives in `src/site/content/` as `{ en, ar }`
objects and is resolved by `useT()`, so translating a string never means editing
JSX, and swapping the content modules for a CMS response is a drop-in change.
Anything dynamic — universities, partner clinics, testimonials, the contact
form, the AI demo — goes through `siteService`, exactly like the portal.

`src/config/paths.js` owns every URL. The public site sits at `/`, the portal at
`/app`; moving the portal to its own subdomain is a change to `APP_BASE` alone.

---

## Dental standards

`src/config/dentalStandards.js` is the clinical reference layer. It is an
abbreviated working set, not a licensed code book — replace it with a maintained
catalogue when the backend owns this data.

- **Notation** — FDI (ISO 3950) is the internal key for every tooth. Universal
  (ADA) and Palmer are display conversions in `components/dental/notation.js`;
  the patient record has a notation switcher.
- **Surfaces** — M / O / I / D / B / L, anterior vs posterior aware. The
  odontogram charts per surface, and `formatSurfaces` produces the conventional
  `MOD` shorthand.
- **Charting** — conditions carry an ICD-10 hint; caries carries an **ICDAS II**
  severity; planned work carries a **CDT** procedure code.
- **Periodontal** — six sites per tooth (DB/B/MB/DL/L/ML), probing depth,
  recession, bleeding and mobility, with derived CAL and **AAP/EFP 2018**
  staging and grading.
- **Medical** — **ASA** physical status, medical alert flags (anticoagulants,
  bisphosphonates, endocarditis prophylaxis, pregnancy, allergies). These
  surface as a red strip above the fold anywhere a clinician is about to treat.
- **Risk & recall** — CAMBRA-style caries risk drives a suggested recall
  interval; the recall queue tracks due / overdue / scheduled.
- **Prescribing** — a formulary with default sig and duration, and every line
  checked against the patient's recorded allergies before the script can issue.
- **Lab** — appliance types, VITA shade guide, case stages from impression to
  fit, with remakes tracked separately.
- **Infection control** — cycle class (B/S/N), chemical and biological
  indicators, and a 7-day spore-test interval the screen warns about.

---

## Removing the mock backend

Nothing outside `src/api/client.js` imports `@/mock` — verify with:

```bash
grep -rn "@/mock" src --include=*.jsx
```

To go live:

1. Set `VITE_API_MODE=live` and `VITE_API_BASE_URL=https://…` (see `.env.example`).
2. Point `src/api/endpoints.js` at the real paths if they differ.
3. Delete `src/mock/`.

Nothing else changes. Services already return the shapes screens expect, and
`src/api/client.js` already normalises errors, attaches the bearer token and has
a hook for 401 handling.

---

## Conventions

- **One folder per feature.** A screen owns its modals; anything a second screen
  needs moves to `components/`.
- **Data through services only.** Components never import `@/api` or `@/mock`.
- **`useAsync` for reads.** Returns `{ data, loading, error, refetch }` and
  cancels on unmount.
- **Status colours in one place.** `components/shared/statusTone.js` maps every
  domain status string to a badge tone.
- **Permissions, not roles,** in every conditional.
- **No hex in a component.** Colours come from Tailwind tokens, or from
  `@/theme/tokens` where a class cannot reach.
- **No literal internal URL.** Links come from `@/config/paths`.
- **Site copy is data.** Marketing strings live in `src/site/content/` as
  `{ en, ar }` and are read through `useT()`.
- **Accessibility.** Icon-only buttons carry `aria-label`; modals trap Escape and
  lock body scroll; tables use real `<th>`/`<td>`.

---

## Branch layout

Odenta ships as four portals from one codebase. This repository is on the clinic
portal branch:

| Branch | Portal | Status |
| --- | --- | --- |
| `odenta-clinics` | Clinic / practice management | **active** |
| _(future)_ | Dentist-facing portal | not started |
| _(future)_ | Patient portal | not started |
| _(future)_ | Admin / marketplace portal | not started |

`api/`, `auth/`, `components/`, `hooks/`, `lib/` and `layouts/` are portal
agnostic and can be reused verbatim on a sibling branch.
