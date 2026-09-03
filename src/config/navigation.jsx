import {
  BarChart3,
  Boxes,
  CalendarCheck,
  CreditCard,
  Headphones,
  LayoutDashboard,
  PieChart,
  ReceiptText,
  Stethoscope,
  Users,
  UserSquare2,
  Wallet,
  Wrench,
} from "lucide-react";

/**
 * Single source of truth for the sidebar + router.
 * `group: null` renders the item outside of any labelled section.
 */
export const navigation = [
  {
    group: null,
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Clinic",
    items: [
      { label: "Reservations", to: "/reservations", icon: CalendarCheck },
      { label: "Patients", to: "/patients", icon: UserSquare2 },
      { label: "Treatments", to: "/treatments", icon: Stethoscope },
      { label: "Staff List", to: "/staff", icon: Users },
    ],
  },
  {
    group: "Finance",
    items: [
      { label: "Accounts", to: "/accounts", icon: Wallet },
      { label: "Sales", to: "/sales", icon: BarChart3 },
      { label: "Purchases", to: "/purchases", icon: ReceiptText },
      { label: "Payment Method", to: "/payment-methods", icon: CreditCard },
    ],
  },
  {
    group: "Physical Asset",
    items: [
      { label: "Stocks", to: "/stocks", icon: Boxes },
      { label: "Peripherals", to: "/peripherals", icon: Wrench },
    ],
  },
];

export const footerNavigation = [
  { label: "Report", to: "/report", icon: PieChart },
  { label: "Customer Support", to: "/support", icon: Headphones },
];

/** Flattened lookup so the top bar can title itself from the route. */
export const allNavItems = [
  ...navigation.flatMap((section) => section.items),
  ...footerNavigation,
];
