import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const number = new Intl.NumberFormat("en-US");

export const formatMoney = (value) => currency.format(Number(value ?? 0));
export const formatMoneyCompact = (value) => compactCurrency.format(Number(value ?? 0));
export const formatNumber = (value) => number.format(Number(value ?? 0));

export const formatPercent = (value, digits = 2) =>
  `${Number(value ?? 0).toFixed(digits)}%`;

const toDate = (value) =>
  value instanceof Date ? value : typeof value === "string" ? parseISO(value) : new Date(value);

export const formatDate = (value, pattern = "dd/MM/yyyy") => {
  if (!value) return "—";
  try {
    return format(toDate(value), pattern);
  } catch {
    return "—";
  }
};

export const formatLongDate = (value) => formatDate(value, "EEEE, MMMM d, yyyy");
export const formatShortDate = (value) => formatDate(value, "EEE, d MMM yyyy");
export const formatTime = (value) => formatDate(value, "hh:mm a");
export const fromNow = (value) => {
  if (!value) return "—";
  try {
    return `${formatDistanceToNowStrict(toDate(value))} ago`;
  } catch {
    return "—";
  }
};

/** "Christopher Smallwood" -> "CS" */
export const initials = (name = "") =>
  name
    .replace(/^(drg?\.?|dr\.?)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/**
 * Deterministic avatar colour so a user keeps a stable identity between
 * sessions. Drawn from the Odenta palette rather than arbitrary pastels.
 */
const AVATAR_PALETTE = [
  "bg-brand-600 text-white",
  "bg-accent-500 text-white",
  "bg-brand-400 text-white",
  "bg-accent-700 text-white",
  "bg-violet text-white",
  "bg-warning text-white",
  "bg-danger text-white",
];

export const avatarTone = (seed = "") => {
  const total = String(seed)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTE[total % AVATAR_PALETTE.length];
};

export const greetingFor = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};
