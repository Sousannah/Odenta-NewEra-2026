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
  Users,
  UserSquare2,
  Wallet,
  Wrench,
} from "lucide-react";
import { P } from "@/auth/permissions";
import { ROLE_META } from "@/auth/roles";

/**
 * The navigation registry.
 *
 * Every entry declares the permission it needs. `navigationFor(user)` filters
 * the tree, so a role never sees a link it cannot open — and the route guard
 * enforces the same permission if someone types the URL.
 */
const SECTIONS = [
  {
    group: null,
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, home: true },
    ],
  },
  {
    group: "Clinic",
    items: [
      {
        key: "schedule",
        label: "Reservations",
        to: "/schedule",
        icon: CalendarCheck,
        permission: [P.APPOINTMENT_VIEW_ALL, P.APPOINTMENT_VIEW_OWN],
      },
      { key: "patients", label: "Patients", to: "/patients", icon: UserSquare2, permission: P.PATIENT_VIEW },
      { key: "recalls", label: "Recalls", to: "/recalls", icon: Activity, permission: P.RECALL_VIEW },
      { key: "treatments", label: "Treatments", to: "/treatments", icon: Stethoscope, permission: P.TREATMENT_VIEW },
      { key: "staff", label: "Staff List", to: "/staff", icon: Users, permission: P.STAFF_VIEW },
    ],
  },
  {
    group: "Clinical",
    items: [
      { key: "plans", label: "Treatment Plans", to: "/treatment-plans", icon: ClipboardList, permission: [P.TREATMENT_PLAN_CREATE, P.PATIENT_CLINICAL_VIEW] },
      { key: "lab", label: "Lab Cases", to: "/lab-cases", icon: FlaskConical, permission: P.LAB_CASE_VIEW },
      { key: "sterilization", label: "Sterilisation", to: "/sterilisation", icon: ShieldCheck, permission: P.STERILIZATION_VIEW },
    ],
  },
  {
    group: "Finance",
    items: [
      { key: "accounts", label: "Accounts", to: "/accounts", icon: Wallet, permission: P.ACCOUNT_VIEW },
      { key: "sales", label: "Sales", to: "/sales", icon: BarChart3, permission: P.BILL_VIEW },
      { key: "purchases", label: "Purchases", to: "/purchases", icon: ReceiptText, permission: P.PURCHASE_VIEW },
      { key: "payment-methods", label: "Payment Method", to: "/payment-methods", icon: CreditCard, permission: P.PAYMENT_METHOD_MANAGE },
    ],
  },
  {
    group: "Physical Asset",
    items: [
      { key: "stocks", label: "Stocks", to: "/stocks", icon: Boxes, permission: P.STOCK_VIEW },
      { key: "peripherals", label: "Peripherals", to: "/peripherals", icon: Wrench, permission: P.PERIPHERAL_VIEW },
    ],
  },
];

const FOOTER = [
  { key: "report", label: "Report", to: "/report", icon: PieChart, permission: [P.REPORT_CLINICAL, P.REPORT_FINANCIAL] },
  { key: "audit", label: "Audit Log", to: "/audit", icon: ScrollText, permission: P.AUDIT_VIEW },
  { key: "support", label: "Customer Support", to: "/support", icon: Headphones, permission: P.SUPPORT_VIEW },
];

const allow = (user, permission) => {
  if (!permission) return true;
  const granted = user?.permissions ?? [];
  const list = Array.isArray(permission) ? permission : [permission];
  return list.some((entry) => granted.includes(entry));
};

/** Sidebar tree for the signed-in user, with the dashboard pointed at their home. */
export function navigationFor(user) {
  const home = ROLE_META[user?.role]?.home ?? "/";

  const sections = SECTIONS.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => allow(user, item.permission))
      .map((item) => (item.home ? { ...item, to: home } : item)),
  })).filter((section) => section.items.length > 0);

  const footer = FOOTER.filter((item) => allow(user, item.permission));

  return { sections, footer };
}

/** Flat list used by the top bar to title the current route. */
export function allNavItems(user) {
  const { sections, footer } = navigationFor(user);
  return [...sections.flatMap((section) => section.items), ...footer];
}

/** Route-level permission map — the guard reads this. */
export const ROUTE_PERMISSIONS = {
  "/schedule": [P.APPOINTMENT_VIEW_ALL, P.APPOINTMENT_VIEW_OWN],
  "/patients": P.PATIENT_VIEW,
  "/recalls": P.RECALL_VIEW,
  "/treatments": P.TREATMENT_VIEW,
  "/staff": P.STAFF_VIEW,
  "/treatment-plans": [P.TREATMENT_PLAN_CREATE, P.PATIENT_CLINICAL_VIEW],
  "/lab-cases": P.LAB_CASE_VIEW,
  "/sterilisation": P.STERILIZATION_VIEW,
  "/accounts": P.ACCOUNT_VIEW,
  "/sales": P.BILL_VIEW,
  "/purchases": P.PURCHASE_VIEW,
  "/payment-methods": P.PAYMENT_METHOD_MANAGE,
  "/stocks": P.STOCK_VIEW,
  "/peripherals": P.PERIPHERAL_VIEW,
  "/report": [P.REPORT_CLINICAL, P.REPORT_FINANCIAL],
  "/audit": P.AUDIT_VIEW,
  "/support": P.SUPPORT_VIEW,
};
