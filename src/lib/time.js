/** Calendar geometry helpers shared by the reservation board. */

const DAY_MS = 86_400_000;

/**
 * Today, as the person in front of the screen would write it.
 *
 * `new Date().toISOString().slice(0, 10)` is UTC, so east of Greenwich it
 * returns *yesterday* for the first hours after local midnight — long enough
 * to make a clinic list look empty at 1am. Every screen that compares against
 * a `YYYY-MM-DD` column should use this instead.
 */
export const toDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

/** `todayKey()` shifted by whole days, still in local time. */
export const dateKeyOffset = (days, from = new Date()) =>
  toDateKey(new Date((from instanceof Date ? from : new Date(from)).getTime() + days * DAY_MS));

export const SLOT_START_HOUR = 8; // 8am
export const SLOT_END_HOUR = 20; // 8pm
export const SLOT_HEIGHT = 96; // px per hour

export const hourRange = () =>
  Array.from({ length: SLOT_END_HOUR - SLOT_START_HOUR + 1 }, (_, i) => SLOT_START_HOUR + i);

export const labelForHour = (hour) => {
  const suffix = hour >= 12 ? "pm" : "am";
  const base = hour % 12 === 0 ? 12 : hour % 12;
  return `${base}${suffix}`;
};

/** "09:00" -> 9.0 ; "14:30" -> 14.5 */
export const toDecimalHours = (value) => {
  const [h, m] = String(value).split(":").map(Number);
  return h + (m || 0) / 60;
};

export const toClockLabel = (value) => {
  const [h, m] = String(value).split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const base = h % 12 === 0 ? 12 : h % 12;
  return `${String(base).padStart(2, "0")}:${String(m || 0).padStart(2, "0")} ${suffix}`;
};

export const offsetFor = (start) => (toDecimalHours(start) - SLOT_START_HOUR) * SLOT_HEIGHT;

export const heightFor = (start, end) =>
  Math.max((toDecimalHours(end) - toDecimalHours(start)) * SLOT_HEIGHT - 6, 40);

/** Position of the "now" ticker, or null when outside the visible window. */
export const nowOffset = (date = new Date()) => {
  const decimal = date.getHours() + date.getMinutes() / 60;
  if (decimal < SLOT_START_HOUR || decimal > SLOT_END_HOUR) return null;
  return (decimal - SLOT_START_HOUR) * SLOT_HEIGHT;
};
