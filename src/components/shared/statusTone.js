/** One place that maps every domain status string onto a Badge tone. */
const MAP = {
  // appointments
  registered: "info",
  encounter: "warning",
  finished: "success",
  waiting: "warning",
  cancelled: "danger",

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

  // purchase orders
  RECEIVED: "success",
  "IN TRANSIT": "info",
  DRAFT: "neutral",
  CANCELLED: "danger",

  // peripherals
  Used: "success",
  "Not Used": "neutral",
  Draft: "warning",

  // support
  OPEN: "danger",
  PENDING: "warning",
  RESOLVED: "success",

  // employment
  "FULL-TIME": "brand",
  "PART-TIME": "info",
};

export const toneFor = (status) => MAP[status] ?? "neutral";
