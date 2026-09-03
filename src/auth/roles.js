/**
 * Roles that exist in a real dental practice.
 *
 * Kept as plain string constants (not an enum object of objects) so the value
 * that travels to the backend is stable and greppable.
 */
export const ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  DENTIST: "dentist",
  ASSISTANT: "assistant",
  RECEPTIONIST: "receptionist",
  ACCOUNTANT: "accountant",
  LAB_TECH: "lab_tech",
};

export const ROLE_ORDER = [
  ROLES.OWNER,
  ROLES.MANAGER,
  ROLES.DENTIST,
  ROLES.ASSISTANT,
  ROLES.RECEPTIONIST,
  ROLES.ACCOUNTANT,
  ROLES.LAB_TECH,
];

export const ROLE_META = {
  [ROLES.OWNER]: {
    label: "Clinic Owner",
    short: "Owner",
    description:
      "Whole-practice view: revenue, chair utilisation, staff performance and multi-branch health.",
    home: "/owner",
    tone: "brand",
  },
  [ROLES.MANAGER]: {
    label: "Clinic Manager",
    short: "Manager",
    description:
      "Runs the floor: schedule coverage, patient flow, inventory, purchasing and staff rota.",
    home: "/manager",
    tone: "info",
  },
  [ROLES.DENTIST]: {
    label: "Dentist",
    short: "Dentist",
    description:
      "Own chair and caseload: today's list, charting, treatment plans, prescriptions and lab cases.",
    home: "/dentist",
    tone: "success",
  },
  [ROLES.ASSISTANT]: {
    label: "Dental Assistant",
    short: "Assistant",
    description:
      "Chairside support: room turnover, instrument sterilisation, consumables and imaging prep.",
    home: "/assistant",
    tone: "warning",
  },
  [ROLES.RECEPTIONIST]: {
    label: "Receptionist",
    short: "Front Office",
    description:
      "Front desk: waitlist, check-in, booking, recalls, patient registration and taking payment.",
    home: "/front-desk",
    tone: "info",
  },
  [ROLES.ACCOUNTANT]: {
    label: "Accountant",
    short: "Finance",
    description:
      "Money in and out: bills, receipts, account pockets, purchase orders and financial reporting.",
    home: "/finance",
    tone: "neutral",
  },
  [ROLES.LAB_TECH]: {
    label: "Lab Technician",
    short: "Lab",
    description:
      "Prosthetic work orders: case queue, shade and impression details, due dates and dispatch.",
    home: "/lab",
    tone: "danger",
  },
};

export const roleLabel = (role) => ROLE_META[role]?.label ?? "Unknown role";
export const roleHome = (role) => ROLE_META[role]?.home ?? "/";

/** Roles that see patient clinical data — drives the PHI banner and audit log. */
export const CLINICAL_ROLES = [ROLES.DENTIST, ROLES.ASSISTANT, ROLES.MANAGER, ROLES.OWNER];
