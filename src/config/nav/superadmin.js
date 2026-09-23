import {
  Headphones,
  KeyRound,
  Radar,
  Receipt,
  ScrollText,
  Server,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  University,
  Users,
} from "lucide-react";
import { P, SA } from "@/auth/permissions";
import { platform } from "@/config/paths";
import { ROLES } from "@/auth/roles";

/**
 * Odenta's own console, and the whole of what the platform account is offered.
 *
 * ## What this file deliberately does not contain
 *
 * Any tenant screen. Not a clinic one, not a campus one.
 *
 * Before the per-role split, the platform account's sidebar was whatever fell
 * out of intersecting the two shared registries with its grant, and in the
 * clinic shell that produced: Reservations, Patients, Recalls, Treatments,
 * Staff List, Lab Cases, Sterilisation, Accounts, Sales, Purchases, Stocks,
 * Peripherals, Report and the Audit Log. That is the clinic owner's sidebar
 * wearing a Super Admin badge, and it is the defect this work was opened for.
 *
 * Three things were wrong with it at once:
 *
 *   **It was not a decision.** Nobody chose to give the founders' account a
 *   practice sidebar. It was an intersection, and intersections change silently
 *   when either side moves.
 *
 *   **Half of it did not work.** The frontend matrix granted fourteen clinic
 *   permissions that the server's matrix never granted, so those entries
 *   rendered, invited a click and answered 403. A navigation entry is a promise
 *   about what a person can do.
 *
 *   **It was a standing grant with no record.** A permanent seat inside a
 *   customer's practice, held by the one account that can reach every customer,
 *   with no row written anywhere saying it had been used.
 *
 * ## How a platform operator reaches a tenant now
 *
 * Through the Tenants screen, which opens a read-only preview: a short-lived
 * signed session naming that tenant, refusing every mutating verb, and writing
 * an `impersonation` security event when it is minted. The server enforces it —
 * `middleware/clinicScope.js` refuses a platform session that carries no
 * preview claim, so this is not a convention the UI is trusted to keep.
 *
 * A supervised door with a log on it beats a standing grant nobody can audit,
 * and it costs an operator one extra click.
 *
 * ## Why the campus admin screens are gone too
 *
 * `uni.accounts`, `uni.people`, `uni.news` and `uni.bulkCreate` used to appear
 * here. They were already broken: those endpoints are partitioned by campus and
 * the platform account carries no `campusId`, so every one of them queried the
 * null partition and returned nothing. The working, cross-tenant equivalents
 * are Accounts and Tenants in the Platform group below, which is where an
 * operator should have been all along.
 */

const console_ = {
  sections: [
    {
      /**
       * Ordered the way a founder actually works down a morning: what happened,
       * who it happened to, is anything wrong, is anything broken, are we
       * getting paid, and only then the settings nobody touches twice a year.
       */
      group: "Platform",
      items: [
        { key: "platform", label: "Command Centre", to: platform.overview, icon: Radar, permission: SA.OVERVIEW_VIEW },
        { key: "platform-tenants", label: "Tenants", to: platform.tenants, icon: University, permission: SA.TENANT_VIEW },
        { key: "platform-accounts", label: "Accounts", to: platform.accounts, icon: Users, permission: SA.ACCOUNT_VIEW },
        { key: "platform-analytics", label: "Insights", to: platform.analytics, icon: TrendingUp, permission: SA.ANALYTICS_VIEW },
      ],
    },
    {
      group: "Trust & Safety",
      items: [
        { key: "platform-security", label: "Security", to: platform.security, icon: ShieldAlert, permission: SA.SECURITY_VIEW },
        { key: "platform-activity", label: "Audit Trail", to: platform.activity, icon: ScrollText, permission: SA.AUDIT_VIEW },
        { key: "platform-roles", label: "Roles", to: platform.roles, icon: KeyRound, permission: SA.ROLE_VIEW },
      ],
    },
    {
      group: "Operations",
      items: [
        { key: "platform-servers", label: "Infrastructure", to: platform.servers, icon: Server, permission: SA.INFRA_VIEW },
        { key: "platform-billing", label: "Billing", to: platform.billing, icon: Receipt, permission: SA.BILLING_VIEW },
        { key: "platform-settings", label: "Settings", to: platform.settings, icon: SlidersHorizontal, permission: SA.SETTINGS_MANAGE },
      ],
    },
  ],
  footer: [
    { key: "support", label: "Support", to: platform.support, icon: Headphones, permission: P.SUPPORT_VIEW },
  ],
};

export const PLATFORM_NAV = { [ROLES.SUPERADMIN]: console_ };
