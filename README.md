# Odenta NewEra 2026 — Clinic portal (frontend)

React front end for the Odenta clinic portal, built to the Zendenta design
system (Fikri Studio) and the flows in the reference screens: reservations,
patient records, the 4-step medical checkup, billing, inventory and reporting.

Frontend only. Every screen is driven by mock data today; the real backend
plugs in behind `src/services/` without touching a single component.

---

## Getting started

```bash
npm install
```

```bash
npm run dev
```

The dev server runs on <http://localhost:5180>.

```bash
npm run build
```

Stack: **React 18 · Vite 5 · React Router 6 · Tailwind CSS 3 · Recharts ·
lucide-react**. Plain JavaScript + JSX, no TypeScript.

---

## Branch layout

Odenta ships as four portals out of one codebase. This repository starts on the
clinic portal branch:

| Branch | Portal | Status |
| --- | --- | --- |
| `odenta-clinics` | Clinic / practice management (this work) | **active** |
| _(future)_ | Dentist portal | not started |
| _(future)_ | Patient portal | not started |
| _(future)_ | Admin / marketplace portal | not started |

Everything shared between portals lives under `src/components`, `src/lib`,
`src/hooks` and `src/layouts` so a sibling branch can reuse it verbatim. Only
`src/features/*` and `src/config/navigation.jsx` are portal-specific.

---

## Project structure

```
src/
├── app/router.jsx            route table (lazy-loaded pages)
├── config/
│   ├── navigation.jsx        sidebar + route labels — single source of truth
│   └── domain.js             shared vocabulary (statuses, questionnaires…)
├── layouts/                  AppLayout · Sidebar · Topbar
├── components/
│   ├── ui/                   design-system primitives (Button, Modal, DataTable…)
│   ├── charts/               Recharts wrappers with the Odenta look
│   ├── dental/               odontogram (ToothChart) + FDI tooth map
│   └── shared/               PageHeader, StatCard, status→tone mapping, logo
├── features/                 one folder per screen, self-contained
│   ├── dashboard/  reservations/  patients/  treatments/  staff/
│   ├── accounts/   sales/         purchases/ paymentMethods/
│   └── stocks/     peripherals/   report/    support/   misc/
├── hooks/                    useAsync · useDisclosure · useLocalStorage · …
├── lib/                      cn (class merge) · format · time (calendar math)
├── services/                 THE DATA CONTRACT — swap for real HTTP calls
├── mock/                     temporary fixtures (delete later, see below)
└── styles/index.css          Tailwind entry + design tokens
```

### Design tokens

Colours, radii and shadows live in `tailwind.config.js` (`brand`, `ink`,
`canvas`, `success`, `warning`, `danger`, `info`). Use those names rather than
raw hex so a re-theme is a one-file change. `src/styles/index.css` adds the
`od-card`, `od-label`, `od-focus` and hatch-pattern component classes.

---

## Removing the mock data

Nothing outside `src/services/` imports `@/mock` — verify with:

```bash
grep -rn "@/mock" src --include=*.jsx
```

To go live:

1. Re-implement each exported function in `src/services/*Service.js` with a
   real request. Keep the function names and return shapes — they are the
   contract the screens are written against.
2. Delete `src/mock/` and `src/services/http.mock.js`.
3. Nothing else changes. Screens already render loading, empty and error states
   through the `useAsync` hook.

Service modules:

| Module | Covers |
| --- | --- |
| `clinicService` | clinic, user, patients, staff, treatments, reservations, dental records, attachments, inventory, support |
| `financeService` | accounts, transactions, bills, payments, payment methods, purchases |
| `analyticsService` | dashboard widgets, report metrics |

---

## Screens

| Route | Screen | Notes |
| --- | --- | --- |
| `/dashboard` | Cashflow, expenses donut, income/expense, patients split, popular treatments, stock availability |
| `/reservations` | Day calendar per dentist, live time ticker, log history |
| | → Add patient to waitlist | 3-step wizard (treatment, basics, oral hygiene) |
| | → Reservation drawer | status change, payment, general info, side rail |
| | → Medical Checkup | 4 steps with the interactive odontogram + per-tooth popover |
| | → Medical Record | per-tooth Done / Not Done with reasons |
| | → Treatment Summary | pricing, components used, medicine, finish treatment |
| `/patients` | Table, patient drawer with dental record and plans |
| `/treatments` | Grid / list, treatment editor |
| `/staff` | Dentists and general staff, working days, assignments |
| `/accounts` | Pockets, balances, transfer money, ledger |
| `/sales` | Revenue KPIs, bills with expandable lines, payment flow, history & comments |
| `/purchases` | Vendor orders |
| `/payment-methods` | Enable / disable methods, fees, settlement account |
| `/stocks` | Inventory with reorder thresholds |
| `/peripherals` | Equipment assets |
| `/report` | Period performance, dual-axis weekly chart, dentist table |
| `/support` | Request threads and help articles |

---

## Conventions

- **One folder per feature.** A screen owns its modals and panels; anything a
  second screen needs moves to `components/`.
- **Data through services only.** Components never import fixtures directly.
- **Status colours in one place.** `components/shared/statusTone.js` maps every
  domain status string to a badge tone — add new statuses there, not inline.
- **`useAsync` for reads.** It returns `{ data, loading, error, refetch }` and
  cancels on unmount.
- **Accessibility.** Icon-only buttons carry `aria-label`; modals trap Escape
  and lock body scroll.
