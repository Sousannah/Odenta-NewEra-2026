/** One place that maps every domain status string onto a Badge tone. */
const MAP = {
  // appointments
  registered: "info",
  arrived: "brand",
  encounter: "warning",
  finished: "success",
  waiting: "warning",
  cancelled: "danger",
  no_show: "neutral",

  // payments
  PAID: "success",
  UNPAID: "danger",
  "PARTIALLY PAID": "warning",
  "FULLY PAID": "success",
  "SET PAYMENT": "brand",

  // stock
  "IN STOCK": "success",
  "LOW STOCK": "warning",
  "OUT OF STOCK": "danger",

  // stock orders & purchase orders
  DRAFT: "neutral",
  SUBMITTED: "info",
  APPROVED: "brand",
  RECEIVED: "success",
  "IN TRANSIT": "info",
  CANCELLED: "danger",

  // peripherals
  Used: "success",
  "Not Used": "neutral",
  Draft: "warning",

  // lab case stages
  impression: "neutral",
  sent: "info",
  in_production: "warning",
  try_in: "brand",
  returned: "success",
  fitted: "success",
  remake: "danger",

  // sterilisation
  pass: "success",
  fail: "danger",
  pending: "warning",

  // treatment plans
  proposed: "info",
  in_progress: "warning",
  completed: "success",
  declined: "danger",

  // rooms
  ready: "success",
  turnover: "warning",
  occupied: "brand",

  // recalls
  due: "warning",
  overdue: "danger",
  scheduled: "success",

  // support
  OPEN: "danger",
  PENDING: "warning",
  RESOLVED: "success",

  // employment
  "FULL-TIME": "brand",
  "PART-TIME": "info",

  // caries risk
  low: "success",
  moderate: "info",
  high: "warning",
  extreme: "danger",
};

export const toneFor = (status) => MAP[status] ?? "neutral";

/** Turns snake_case / kebab statuses into readable labels. */
export const labelFor = (status) =>
  String(status ?? "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
