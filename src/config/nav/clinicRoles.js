import {
  Activity,
  BarChart3,
  Boxes,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FlaskConical,
  Headphones,
  LayoutDashboard,
  PieChart,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  UserSquare2,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { P } from "@/auth/permissions";
import { app, roleDashboards } from "@/config/paths";
import { ROLES } from "@/auth/roles";

/**
 * The four practice sidebars, written out one role at a time.
 *
 * Each of these used to be an intersection of a shared twenty-entry tree with a
 * permission grant. They are now four separate lists, and the repetition is the
 * feature: a Dentist's sidebar is something a person decided and can read in one
 * screen, rather than something you work out by holding two files side by side.
 *
 * Each list is a faithful transcription of what the old filter produced for that
 * role — this change removes a leak, it does not quietly take anything away from
 * anybody. The one edit is a group *label* on the front desk, noted below.
 *
 * Every entry still names the permission the server enforces for that screen.
 * That is no longer what builds the list; it is what the cross-check test reads,
 * so an entry dropped into the wrong role's file fails a test instead of
 * shipping.
 */

/* ---------------------------------------------------------------- shared */

/** The dashboard row: same shape everywhere, one destination per role. */
const dashboard = (to) => ({ key: "dashboard", label: "Dashboard", to, icon: LayoutDashboard });

const support = {
  key: "support",
  label: "Customer Support",
  to: app.support,
  icon: Headphones,
  permission: P.SUPPORT_VIEW,
};

/* ----------------------------------------------------------------- owner */

/**
 * The dentist who owns the practice: clinical *and* commercial.
 *
 * The only clinic role with the whole Finance group, the audit log and both
 * report families, because the owner is the person answerable for the P&L and
 * for what a Ministry of Health inspection asks to see.
 */
const owner = {
  sections: [
    { group: null, items: [dashboard(roleDashboards.owner)] },
    {
      group: "Clinic",
      items: [
        { key: "schedule", label: "Reservations", to: app.schedule, icon: CalendarCheck, permission: P.APPOINTMENT_VIEW_ALL },
        { key: "patients", label: "Patients", to: app.patients, icon: UserSquare2, permission: P.PATIENT_VIEW },
        { key: "recalls", label: "Recalls", to: app.recalls, icon: Activity, permission: P.RECALL_VIEW },
        { key: "treatments", label: "Treatments", to: app.treatments, icon: Stethoscope, permission: P.TREATMENT_VIEW },
        { key: "staff", label: "Staff List", to: app.staff, icon: Users, permission: P.STAFF_VIEW },
      ],
    },
    {
      group: "Clinical",
      items: [
        { key: "plans", label: "Treatment Plans", to: app.treatmentPlans, icon: ClipboardList, permission: P.TREATMENT_PLAN_CREATE },
        { key: "lab", label: "Lab Cases", to: app.labCases, icon: FlaskConical, permission: P.LAB_CASE_VIEW },
        { key: "sterilization", label: "Sterilisation", to: app.sterilisation, icon: ShieldCheck, permission: P.STERILIZATION_VIEW },
      ],
    },
    {
      group: "Finance",
      items: [
        { key: "accounts", label: "Accounts", to: app.accounts, icon: Wallet, permission: P.ACCOUNT_VIEW },
        { key: "sales", label: "Sales", to: app.sales, icon: BarChart3, permission: P.BILL_VIEW },
        { key: "purchases", label: "Purchases", to: app.purchases, icon: ReceiptText, permission: P.PURCHASE_VIEW },
        { key: "payment-methods", label: "Payment Method", to: app.paymentMethods, icon: CreditCard, permission: P.PAYMENT_METHOD_MANAGE },
      ],
    },
    {
      group: "Physical Asset",
      items: [
        { key: "stocks", label: "Stocks", to: app.stocks, icon: Boxes, permission: P.STOCK_VIEW },
        { key: "peripherals", label: "Peripherals", to: app.peripherals, icon: Wrench, permission: P.PERIPHERAL_VIEW },
      ],
    },
  ],
  footer: [
    { key: "report", label: "Report", to: app.report, icon: PieChart, permission: P.REPORT_FINANCIAL },
    { key: "audit", label: "Audit Log", to: app.audit, icon: ScrollText, permission: P.AUDIT_VIEW },
    support,
  ],
};

/* --------------------------------------------------------------- dentist */

/**
 * Own chair and caseload.
 *
 * Reservations is gated on `APPOINTMENT_VIEW_OWN` rather than `VIEW_ALL`, and
 * that is the same permission the server reads to rewrite the query to this
 * dentist's own chair — the screen is the whole book for the owner and one
 * column here, enforced in `middleware/clinicScope.js` rather than by the label.
 *
 * Finance is one entry, and the gap is the point: a dentist holds `BILL_VIEW`
 * because in a practice this size the treating dentist quotes the fee, and not
 * `PAYMENT_TAKE`, because money is received at the desk by one person against a
 * bill. No Accounts, no Purchases, no audit log.
 */
const dentist = {
  sections: [
    { group: null, items: [dashboard(roleDashboards.dentist)] },
    {
      group: "Clinic",
      items: [
        { key: "schedule", label: "Reservations", to: app.schedule, icon: CalendarCheck, permission: P.APPOINTMENT_VIEW_OWN },
        { key: "patients", label: "Patients", to: app.patients, icon: UserSquare2, permission: P.PATIENT_VIEW },
        { key: "recalls", label: "Recalls", to: app.recalls, icon: Activity, permission: P.RECALL_VIEW },
        { key: "treatments", label: "Treatments", to: app.treatments, icon: Stethoscope, permission: P.TREATMENT_VIEW },
        { key: "staff", label: "Staff List", to: app.staff, icon: Users, permission: P.STAFF_VIEW },
      ],
    },
    {
      group: "Clinical",
      items: [
        { key: "plans", label: "Treatment Plans", to: app.treatmentPlans, icon: ClipboardList, permission: P.TREATMENT_PLAN_CREATE },
        { key: "lab", label: "Lab Cases", to: app.labCases, icon: FlaskConical, permission: P.LAB_CASE_VIEW },
        { key: "sterilization", label: "Sterilisation", to: app.sterilisation, icon: ShieldCheck, permission: P.STERILIZATION_VIEW },
      ],
    },
    {
      group: "Finance",
      items: [
        { key: "sales", label: "Sales", to: app.sales, icon: BarChart3, permission: P.BILL_VIEW },
      ],
    },
    {
      /* They consume from the store chairside; they do not run a stocktake. */
      group: "Physical Asset",
      items: [
        { key: "stocks", label: "Stocks", to: app.stocks, icon: Boxes, permission: P.STOCK_VIEW },
      ],
    },
  ],
  footer: [
    { key: "report", label: "Report", to: app.report, icon: PieChart, permission: P.REPORT_CLINICAL },
    support,
  ],
};

/* ------------------------------------------------------------- assistant */

/**
 * Chairside.
 *
 * Treatment Plans is here and is gated on `PATIENT_CLINICAL_VIEW`, not on
 * `TREATMENT_PLAN_CREATE` — the assistant *reads* the plan and the chart
 * (allergies, premedication are the whole reason) and writes neither. Naming
 * the read permission rather than the write one is what keeps that distinction
 * legible instead of relying on the screen to be careful.
 *
 * No Finance group at all, and no Recalls or Staff List: nothing about money or
 * the roster is this role's job.
 */
const assistant = {
  sections: [
    { group: null, items: [dashboard(roleDashboards.assistant)] },
    {
      group: "Clinic",
      items: [
        { key: "schedule", label: "Reservations", to: app.schedule, icon: CalendarCheck, permission: P.APPOINTMENT_VIEW_ALL },
        { key: "patients", label: "Patients", to: app.patients, icon: UserSquare2, permission: P.PATIENT_VIEW },
        { key: "treatments", label: "Treatments", to: app.treatments, icon: Stethoscope, permission: P.TREATMENT_VIEW },
      ],
    },
    {
      group: "Clinical",
      items: [
        { key: "plans", label: "Treatment Plans", to: app.treatmentPlans, icon: ClipboardList, permission: P.PATIENT_CLINICAL_VIEW },
        { key: "lab", label: "Lab Cases", to: app.labCases, icon: FlaskConical, permission: P.LAB_CASE_VIEW },
        /* The register an inspection asks for, and the one thing in the
           clinical family this role writes. */
        { key: "sterilization", label: "Sterilisation", to: app.sterilisation, icon: ShieldCheck, permission: P.STERILIZATION_LOG },
      ],
    },
    {
      group: "Physical Asset",
      items: [
        { key: "stocks", label: "Stocks", to: app.stocks, icon: Boxes, permission: P.STOCK_VIEW },
        { key: "peripherals", label: "Peripherals", to: app.peripherals, icon: Wrench, permission: P.PERIPHERAL_VIEW },
      ],
    },
  ],
  footer: [support],
};

/* ---------------------------------------------------------- receptionist */

/**
 * The front desk.
 *
 * The line this sidebar exists to draw is the absence of a clinical group. The
 * desk registers a patient, books them, checks them in and takes their money,
 * and never opens a chart — enforced structurally on the server, where the
 * roster row the desk reads lives in a different container from the record.
 *
 * Lab Cases used to sit under a group headed "Clinical" here, which was the one
 * thing in this file that read as a contradiction: the desk's relationship to a
 * lab case is chasing a vendor so the patient can be told their crown is in, not
 * clinical work. The group is renamed "Coordination". No permission and no
 * destination changed — the desk reaches exactly the same screen it did before.
 */
const receptionist = {
  sections: [
    { group: null, items: [dashboard(roleDashboards.receptionist)] },
    {
      group: "Clinic",
      items: [
        { key: "schedule", label: "Reservations", to: app.schedule, icon: CalendarCheck, permission: P.APPOINTMENT_VIEW_ALL },
        { key: "patients", label: "Patients", to: app.patients, icon: UserSquare2, permission: P.PATIENT_VIEW },
        { key: "recalls", label: "Recalls", to: app.recalls, icon: Activity, permission: P.RECALL_VIEW },
        { key: "treatments", label: "Treatments", to: app.treatments, icon: Stethoscope, permission: P.TREATMENT_VIEW },
        { key: "staff", label: "Staff List", to: app.staff, icon: Users, permission: P.STAFF_VIEW },
      ],
    },
    {
      group: "Coordination",
      items: [
        { key: "lab", label: "Lab Cases", to: app.labCases, icon: FlaskConical, permission: P.LAB_CASE_VIEW },
      ],
    },
    {
      group: "Finance",
      items: [
        { key: "sales", label: "Sales", to: app.sales, icon: BarChart3, permission: P.BILL_VIEW },
      ],
    },
  ],
  footer: [support],
};

export const CLINIC_NAV = {
  [ROLES.OWNER]: owner,
  [ROLES.DENTIST]: dentist,
  [ROLES.ASSISTANT]: assistant,
  [ROLES.RECEPTIONIST]: receptionist,
};
