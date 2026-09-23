/**
 * How the platform console renders the things only it shows.
 *
 * One module rather than helpers repeated per screen, because the two mistakes
 * these prevent are both silent. Money arrives as piastres and looks like a
 * plausible number if you forget to divide it; a severity or a status rendered
 * with the wrong tone tells an operator that something critical is fine.
 */

/**
 * Money.
 *
 * Every `…Egp` field from the platform API is an integer number of piastres —
 * EGP × 100 — because a quarter of a piastre does not exist and floating point
 * cannot represent 0.1. The server counts in integers and this is the only
 * place the division happens, so a screen cannot accidentally show a figure a
 * hundred times too large.
 */
const egpFull = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const egpCompact = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatEgp = (piastres) => egpFull.format(Number(piastres ?? 0) / 100);

/** `EGP 4.2M` — for a KPI tile, where the exact piastre is noise. */
export const formatEgpCompact = (piastres) => egpCompact.format(Number(piastres ?? 0) / 100);

/* --------------------------------------------------------------- tones */

/**
 * Tenant status → badge tone.
 *
 * `past_due` is warning rather than danger on purpose: an invoice in the post
 * is a conversation, and colouring it the same as a suspension would make the
 * one row that needs action indistinguishable from the four that do not.
 */
export const TENANT_TONE = {
  active: "success",
  trial: "info",
  past_due: "warning",
  suspended: "danger",
  archived: "neutral",
};

export const TENANT_LABEL = {
  active: "Active",
  trial: "Trial",
  past_due: "Past due",
  suspended: "Suspended",
  archived: "Archived",
};

/**
 * Account status → tone.
 *
 * `invited` is deliberately not "success". An account created and never signed
 * into is a job somebody has not finished, and the tile that counts them is the
 * one that catches a cohort import whose credentials were never sent out.
 */
export const ACCOUNT_TONE = {
  active: "success",
  disabled: "danger",
  locked: "warning",
  invited: "info",
};

export const ACCOUNT_LABEL = {
  active: "Active",
  disabled: "Deactivated",
  locked: "Locked",
  invited: "Invited",
};

/** Severity → tone. `info` stays neutral so the feed's colour means something. */
export const SEVERITY_TONE = {
  info: "neutral",
  low: "info",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

export const SEVERITY_LABEL = {
  info: "Info",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Overall posture → the headline strip at the top of the security screen. */
export const POSTURE = {
  clear: { tone: "success", label: "All clear", hint: "Nothing outstanding" },
  watch: { tone: "info", label: "Watch", hint: "Events waiting to be reviewed" },
  elevated: { tone: "warning", label: "Elevated", hint: "High-severity activity in the last 24 hours" },
  critical: { tone: "danger", label: "Critical", hint: "Act now" },
};

export const HEALTH_TONE = { healthy: "success", watch: "warning", at_risk: "danger" };
export const HEALTH_LABEL = { healthy: "Healthy", watch: "Watch", at_risk: "At risk" };

export const INVOICE_TONE = {
  draft: "neutral",
  issued: "info",
  paid: "success",
  overdue: "danger",
  void: "neutral",
};

/* -------------------------------------------------------------- numbers */

/**
 * A trend, as the chip component wants it.
 *
 * The server returns `changePct: null` when there is no baseline — growth from
 * zero is not a percentage, and every trend component that has ever rendered
 * `Infinity%` got there by dividing anyway. `null` here means the chip is
 * simply not shown.
 */
export const trendOf = (entry) => (entry?.changePct === null ? null : entry?.changePct);

/** `1.4 GB` / `412 GB` / `1.9 TB` — storage, from a number of gigabytes. */
export function formatStorage(gb) {
  const value = Number(gb ?? 0);
  if (value >= 1024) return `${(value / 1024).toFixed(1)} TB`;
  if (value < 1) return `${Math.round(value * 1024)} MB`;
  return `${Math.round(value)} GB`;
}

/** `2.4s` / `840ms` — latency, at the precision a person reads it. */
export const formatMs = (ms) => (Number(ms) >= 1000 ? `${(Number(ms) / 1000).toFixed(1)}s` : `${Math.round(Number(ms ?? 0))}ms`);

/** `18h 42m` — uptime, from seconds. Days once it gets that far. */
export function formatUptime(seconds) {
  const total = Number(seconds ?? 0);
  if (!total) return "—";
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** The current month as `YYYY-MM`, which is the lane every feed defaults to. */
export const thisMonth = () => new Date().toISOString().slice(0, 7);

/** The last twelve months, newest first, for a month picker. */
export function recentMonths(count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
    };
  });
}

/** The ranges every platform screen offers, spelled once. */
export const RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "180d", label: "Last 6 months" },
  { value: "365d", label: "Last year" },
];
