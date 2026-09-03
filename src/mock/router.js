import { ROLE_META } from "@/auth/roles";
import { permissionsFor } from "@/auth/permissions";
import { ApiError, notFound } from "@/api/errors";
import * as db from "./index";

/**
 * In-memory stand-in for the HTTP API.
 *
 * `mockRouter(method, path, { params, body })` resolves the same shapes the
 * real endpoints will return. Handlers are registered against a path pattern
 * with `:param` segments, so the route table reads like a server's.
 *
 * Delete this file, `src/mock/` and set VITE_API_MODE=live to go real.
 */

const LATENCY_MS = 140;

const delay = (value) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), LATENCY_MS));

const contains = (haystack, needle) =>
  String(haystack ?? "").toLowerCase().includes(String(needle).trim().toLowerCase());

const search = (rows, query, fields) => {
  if (!query || !String(query).trim()) return rows;
  return rows.filter((row) => fields.some((field) => contains(row[field], query)));
};

/* ------------------------------------------------------- mutable session */

let currentUserId = null;

const buildSession = (user) => ({
  token: `mock.${user.id}.${Date.now()}`,
  user: {
    ...user,
    permissions: permissionsFor(user.role),
    roleLabel: ROLE_META[user.role]?.label,
    home: ROLE_META[user.role]?.home,
  },
  clinic: db.clinic,
});

/* ---------------------------------------------------------- route table */

const routes = [];
const on = (method, pattern, handler) => routes.push({ method, pattern, handler });

const matchRoute = (method, path) => {
  for (const route of routes) {
    if (route.method !== method) continue;
    const patternParts = route.pattern.split("/");
    const pathParts = path.split("/");
    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    const matched = patternParts.every((part, index) => {
      if (part.startsWith(":")) {
        params[part.slice(1)] = decodeURIComponent(pathParts[index]);
        return true;
      }
      return part === pathParts[index];
    });

    if (matched) return { handler: route.handler, params };
  }
  return null;
};

/* ------------------------------------------------------------------ auth */

on("POST", "/auth/sign-in", ({ body }) => {
  const user = body?.role
    ? db.users.find((item) => item.role === body.role)
    : db.users.find((item) => item.email?.toLowerCase() === String(body?.email).toLowerCase());

  if (!user) {
    throw new ApiError("No account matches those credentials", {
      status: 401,
      code: "invalid_credentials",
    });
  }
  currentUserId = user.id;
  return buildSession(user);
});

on("POST", "/auth/sign-out", () => {
  currentUserId = null;
  return null;
});

on("GET", "/auth/session", ({ params: query }) => {
  const id = query?.userId ?? currentUserId;
  const user = db.users.find((item) => item.id === id);
  if (!user) throw new ApiError("No active session", { status: 401, code: "no_session" });
  currentUserId = user.id;
  return buildSession(user);
});

/* ---------------------------------------------------------------- clinic */

on("GET", "/clinic", () => db.clinic);
on("GET", "/clinic/branches", () => db.clinic.branches);

/* ----------------------------------------------------------------- staff */

on("GET", "/staff", ({ params: query }) => {
  const group = query?.group ?? "all";
  const rows =
    group === "dentist" ? db.dentists : group === "general" ? db.generalStaff : db.staffList;
  return search(rows, query?.q, ["name", "email", "role", "speciality"]);
});

on("GET", "/staff/dentists", () => db.dentists);

on("GET", "/staff/:id", ({ params }) => {
  const staff = db.staffById(params.id);
  if (!staff) throw notFound(`/staff/${params.id}`);
  return staff;
});

/* -------------------------------------------------------------- patients */

const decoratePatient = (patient) => ({
  ...patient,
  primaryDentist: db.staffById(patient.primaryDentistId)?.name ?? null,
  openBalance: patient.balance,
});

on("GET", "/patients", ({ params: query }) => {
  let rows = db.patients;
  if (query?.status && query.status !== "all") {
    rows = rows.filter((item) => item.status === query.status);
  }
  if (query?.dentistId && query.dentistId !== "all") {
    rows = rows.filter((item) => item.primaryDentistId === query.dentistId);
  }
  if (query?.risk && query.risk !== "all") {
    rows = rows.filter((item) => item.cariesRisk === query.risk);
  }
  return search(rows, query?.q, ["name", "email", "phone", "id", "mrn", "address"]).map(
    decoratePatient
  );
});

on("GET", "/patients/:id", ({ params }) => {
  const patient = db.patientById(params.id);
  if (!patient) throw notFound(`/patients/${params.id}`);
  return decoratePatient(patient);
});

on("POST", "/patients", ({ body }) => {
  const created = {
    id: `PT-${1000 + db.patients.length + 1}`,
    mrn: `AVC-${new Date().getFullYear()}-${1000 + db.patients.length + 1}`,
    status: "active",
    registered: new Date().toISOString().slice(0, 10),
    lastVisited: null,
    balance: 0,
    alerts: [],
    allergies: [],
    medications: [],
    primaryDentistId: db.dentists[0]?.id ?? null,
    ...body,
  };
  db.patients.unshift(created);
  return decoratePatient(created);
});

on("PATCH", "/patients/:id", ({ params, body }) => {
  const patient = db.patientById(params.id);
  if (!patient) throw notFound(`/patients/${params.id}`);
  Object.assign(patient, body);
  return decoratePatient(patient);
});

on("PUT", "/patients/:id/chart", ({ params, body }) => {
  db.charts[params.id] = body?.chart ?? [];
  return db.charts[params.id];
});

on("PUT", "/patients/:id/perio", ({ params, body }) => {
  db.perioCharts[params.id] = {
    recordedAt: new Date().toISOString().slice(0, 10),
    recordedBy: body?.recordedBy ?? null,
    stage: body?.stage ?? null,
    grade: body?.grade ?? null,
    data: body?.data ?? {},
  };
  return db.perioCharts[params.id];
});

on("POST", "/patients/:id/prescriptions", ({ params, body }) => {
  const created = {
    id: `RX-${Math.floor(Math.random() * 9000) + 1000}`,
    patientId: params.id,
    dentistId: body?.dentistId ?? null,
    appointmentId: body?.appointmentId ?? null,
    issuedAt: new Date().toISOString().slice(0, 10),
    status: "active",
    items: body?.items ?? [],
    notes: body?.notes ?? "",
  };
  db.prescriptions.unshift(created);
  return created;
});

on("GET", "/patients/:id/clinical", ({ params }) => ({
  chart: db.charts[params.id] ?? [],
  perio: db.perioCharts[params.id] ?? null,
  notes: db.clinicalNotes.filter((note) => note.patientId === params.id),
  hygiene: db.hygieneSurveys[params.id] ?? null,
}));

on("GET", "/patients/:id/chart", ({ params }) => db.charts[params.id] ?? []);
on("GET", "/patients/:id/perio", ({ params }) => db.perioCharts[params.id] ?? null);

on("GET", "/patients/:id/treatment-plans", ({ params }) =>
  db.treatmentPlans.filter((plan) => plan.patientId === params.id)
);

on("GET", "/patients/:id/appointments", ({ params }) =>
  db.appointments
    .filter((item) => item.patientId === params.id)
    .map((item) => ({ ...item, dentist: db.staffById(item.dentistId)?.name ?? null }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
);

on("GET", "/patients/:id/prescriptions", ({ params }) =>
  db.prescriptions
    .filter((item) => item.patientId === params.id)
    .map((item) => ({ ...item, dentist: db.staffById(item.dentistId)?.name ?? null }))
);

on("GET", "/patients/:id/attachments", ({ params }) =>
  db.attachments.filter((item) => item.patientId === params.id)
);

/* ---------------------------------------------------------- appointments */

const decorateAppointment = (item) => {
  const patient = db.patientById(item.patientId);
  return {
    ...item,
    patientName: patient?.name ?? "Unknown patient",
    patientAlerts: patient?.alerts ?? [],
    patientAsa: patient?.asa ?? null,
    dentistName: db.staffById(item.dentistId)?.name ?? null,
  };
};

on("GET", "/appointments", ({ params: query }) => {
  let rows = db.appointments;
  if (query?.date) rows = rows.filter((item) => item.date === query.date);
  if (query?.dentistId && query.dentistId !== "all") {
    rows = rows.filter((item) => item.dentistId === query.dentistId);
  }
  if (query?.patientId) rows = rows.filter((item) => item.patientId === query.patientId);
  if (query?.status && query.status !== "all") {
    rows = rows.filter((item) => item.status === query.status);
  }
  return rows.map(decorateAppointment);
});

on("GET", "/appointments/log", () => db.appointmentLog);
on("GET", "/appointments/waitlist", () => db.waitlist);

on("POST", "/appointments", ({ body }) => {
  const created = {
    id: `RSVA${Math.floor(Math.random() * 9000) + 1000}`,
    status: "registered",
    source: "MANUAL APPOINTMENT",
    paymentStatus: "UNPAID",
    billId: null,
    checkedInAt: null,
    ...body,
  };
  db.appointments.unshift(created);
  return decorateAppointment(created);
});

on("GET", "/appointments/:id", ({ params }) => {
  const item = db.appointments.find((entry) => entry.id === params.id);
  if (!item) throw notFound(`/appointments/${params.id}`);
  return decorateAppointment(item);
});

on("PATCH", "/appointments/:id", ({ params, body }) => {
  const item = db.appointments.find((entry) => entry.id === params.id);
  if (!item) throw notFound(`/appointments/${params.id}`);
  Object.assign(item, body);
  return decorateAppointment(item);
});

/* ------------------------------------------------------------ treatments */

on("GET", "/treatments", ({ params: query }) => {
  let rows = db.treatments;
  if (query?.active === "true") rows = rows.filter((item) => item.active);
  if (query?.active === "false") rows = rows.filter((item) => !item.active);
  if (query?.category && query.category !== "all") {
    rows = rows.filter((item) => item.category === query.category);
  }
  if (query?.service && query.service !== "all") {
    rows = rows.filter((item) => item.service === query.service);
  }
  return search(rows, query?.q, ["name", "code", "category", "description"]);
});

on("GET", "/treatments/:id", ({ params }) => {
  const item = db.treatmentById(params.id);
  if (!item) throw notFound(`/treatments/${params.id}`);
  return item;
});

/* --------------------------------------------------------------- finance */

on("GET", "/finance/accounts", ({ params: query }) => {
  if (query?.active === "true") return db.accounts.filter((item) => item.active);
  if (query?.active === "false") return db.accounts.filter((item) => !item.active);
  return db.accounts;
});

on("GET", "/finance/accounts/:id", ({ params }) => {
  const account = db.accounts.find((item) => item.id === params.id);
  if (!account) throw notFound(`/finance/accounts/${params.id}`);
  return {
    ...account,
    transactions: db.accountTransactions.filter((item) => item.accountId === account.id),
  };
});

on("PATCH", "/finance/accounts/:id", ({ params, body }) => {
  const account = db.accounts.find((item) => item.id === params.id);
  if (!account) throw notFound(`/finance/accounts/${params.id}`);
  Object.assign(account, body);
  return account;
});

on("POST", "/finance/accounts", ({ body }) => {
  const created = {
    id: `ACC-${String(db.accounts.length + 1).padStart(2, "0")}`,
    active: true,
    isDefault: false,
    balance: 0,
    change: 0,
    accountNo: null,
    ...body,
  };
  db.accounts.push(created);
  return created;
});

on("GET", "/finance/transactions", ({ params: query }) =>
  query?.accountId
    ? db.accountTransactions.filter((item) => item.accountId === query.accountId)
    : db.accountTransactions
);

on("POST", "/finance/transfer", ({ body }) => {
  const from = db.accounts.find((item) => item.id === body?.fromId);
  const to = db.accounts.find((item) => item.id === body?.toId);
  const amount = Number(body?.amount ?? 0);

  if (!from || !to) throw new ApiError("Account not found", { status: 404, code: "not_found" });
  if (from.id === to.id) {
    throw new ApiError("Choose two different accounts", { status: 422, code: "same_account" });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError("Enter an amount greater than zero", { status: 422, code: "bad_amount" });
  }
  if (amount > from.balance) {
    throw new ApiError("Insufficient balance in the source account", {
      status: 422,
      code: "insufficient_funds",
    });
  }

  from.balance -= amount;
  to.balance += amount;
  const reference = `TRF-${Math.floor(Math.random() * 9000) + 1000}`;
  const at = new Date().toISOString();

  db.accountTransactions.unshift(
    { id: `TRX-${reference}-O`, accountId: from.id, date: at, label: `Transfer to ${to.name}`, reference, direction: "out", amount, method: "Internal transfer", by: "You", billId: null },
    { id: `TRX-${reference}-I`, accountId: to.id, date: at, label: `Transfer from ${from.name}`, reference, direction: "in", amount, method: "Internal transfer", by: "You", billId: null }
  );

  return { reference, at, amount, from, to, note: body?.note ?? "" };
});

on("GET", "/finance/bills", ({ params: query }) => {
  let rows = db.bills;
  if (query?.payment && query.payment !== "all") {
    rows = rows.filter((item) => item.payment === query.payment);
  }
  return search(rows, query?.q, ["id", "patient", "appointmentId"]);
});

on("GET", "/finance/bills/:id", ({ params }) => {
  const item = db.bills.find((entry) => entry.id === params.id);
  if (!item) throw notFound(`/finance/bills/${params.id}`);
  return item;
});

on("GET", "/finance/bills/:id/comments", ({ params }) =>
  db.billComments.filter((item) => item.billId === params.id)
);

on("POST", "/finance/bills/:id/comments", ({ params, body }) => {
  const created = {
    id: `CMT-${Date.now()}`,
    billId: params.id,
    type: "comment",
    author: body?.author ?? "You",
    at: new Date().toISOString(),
    body: body?.body ?? "",
  };
  db.billComments.unshift(created);
  return created;
});

on("GET", "/finance/payments", ({ params: query }) =>
  search(db.paymentsReceived, query?.q, ["id", "patient", "billId", "method"])
);

on("POST", "/finance/payments", ({ body }) => {
  const bill = db.bills.find((item) => item.id === body?.billId);
  if (!bill) throw notFound("/finance/payments");

  const created = {
    id: `PAY-${Math.floor(Math.random() * 9000) + 1000}`,
    billId: bill.id,
    patient: bill.patient,
    date: new Date().toISOString(),
    method: body?.method ?? "Cash",
    account: body?.account ?? "Free Cash",
    amount: Number(body?.amount ?? 0),
    receivedBy: body?.receivedBy ?? "You",
  };

  db.paymentsReceived.unshift(created);
  bill.payment = "FULLY PAID";
  bill.items = bill.items.map((item) => ({ ...item, status: "PAID" }));
  return created;
});

on("GET", "/finance/payment-methods", () => db.paymentMethods);

on("PATCH", "/finance/payment-methods/:id", ({ params, body }) => {
  const method = db.paymentMethods.find((item) => item.id === params.id);
  if (!method) throw notFound(`/finance/payment-methods/${params.id}`);
  Object.assign(method, body);
  return method;
});

on("GET", "/finance/purchases", ({ params: query }) => {
  let rows = db.purchases;
  if (query?.status && query.status !== "all") {
    rows = rows.filter((item) => item.status === query.status);
  }
  return search(rows, query?.q, ["id", "vendor", "category", "account"]);
});

on("GET", "/finance/summary", () => db.financeSummary);

/* ------------------------------------------------------------- inventory */

on("GET", "/inventory/stocks", ({ params: query }) => {
  let rows = db.stocks;
  if (query?.status && query.status !== "all") {
    rows = rows.filter((item) => item.status === query.status);
  }
  if (query?.category && query.category !== "all") {
    rows = rows.filter((item) => item.category === query.category);
  }
  return search(rows, query?.q, ["name", "sku", "vendor", "category"]);
});

on("PATCH", "/inventory/stocks/:id", ({ params, body }) => {
  const stock = db.stocks.find((item) => item.id === params.id);
  if (!stock) throw notFound(`/inventory/stocks/${params.id}`);
  Object.assign(stock, body);
  if (stock.quantity === 0) stock.status = "OUT OF STOCK";
  else if (stock.quantity <= stock.reorderAt) stock.status = "LOW STOCK";
  else stock.status = "IN STOCK";
  return stock;
});

on("GET", "/inventory/stock-orders", () => db.stockOrders);

on("POST", "/inventory/stock-orders", ({ body }) => {
  const created = {
    id: `SO-${Math.floor(Math.random() * 900) + 100}`,
    status: "DRAFT",
    requestedAt: new Date().toISOString().slice(0, 10),
    ...body,
  };
  db.stockOrders.unshift(created);
  return created;
});

on("GET", "/inventory/peripherals", ({ params: query }) => {
  let rows = db.peripherals;
  if (query?.status && query.status !== "all") {
    rows = rows.filter((item) => item.status === query.status);
  }
  return search(rows, query?.q, ["name", "sku", "vendor", "category", "assignedTo"]);
});

/* ------------------------------------------------------------------- lab */

on("GET", "/lab/cases", ({ params: query }) => {
  let rows = db.labCases;
  if (query?.stage && query.stage !== "all") {
    rows = rows.filter((item) => item.stage === query.stage);
  }
  if (query?.dentistId && query.dentistId !== "all") {
    rows = rows.filter((item) => item.dentistId === query.dentistId);
  }
  return search(rows, query?.q, ["id", "patientName", "type", "labName"]);
});

on("PATCH", "/lab/cases/:id", ({ params, body }) => {
  const item = db.labCases.find((entry) => entry.id === params.id);
  if (!item) throw notFound(`/lab/cases/${params.id}`);
  Object.assign(item, body);
  return item;
});

/* ---------------------------------------------------------- sterilisation */

on("GET", "/sterilization/cycles", () => db.sterilizationCycles);

on("POST", "/sterilization/cycles", ({ body }) => {
  const created = {
    id: `CY-${Math.floor(Math.random() * 9000) + 1000}`,
    startedAt: new Date().toISOString(),
    biologicalIndicator: null,
    result: "pending",
    ...body,
  };
  db.sterilizationCycles.unshift(created);
  return created;
});

on("GET", "/rooms", () => db.rooms);

/* ---------------------------------------------------------------- recalls */

on("GET", "/recalls", ({ params: query }) => {
  let rows = db.recalls.map((item) => ({
    ...item,
    patient: db.patientById(item.patientId),
  }));
  if (query?.status && query.status !== "all") {
    rows = rows.filter((item) => item.status === query.status);
  }
  return rows;
});

/* -------------------------------------------------------------- analytics */

const DASHBOARDS = {
  owner: () => db.ownerDashboard,
  manager: () => db.managerDashboard,
  dentist: () => db.dentistDashboard,
  assistant: () => db.assistantDashboard,
  receptionist: () => db.receptionDashboard,
  accountant: () => db.accountantDashboard,
  lab_tech: () => db.labDashboard,
};

on("GET", "/analytics/dashboard/:role", ({ params }) => {
  const build = DASHBOARDS[params.role];
  if (!build) throw notFound(`/analytics/dashboard/${params.role}`);
  return build();
});

on("GET", "/analytics/report", () => db.reportMetrics);

/* ------------------------------------------------------------------ audit */

on("GET", "/audit", ({ params: query }) =>
  search(db.auditLog, query?.q, ["actor", "action", "entity", "detail"])
);

/* ---------------------------------------------------------------- support */

on("GET", "/support/threads", () => db.supportThreads);
on("GET", "/support/articles", ({ params: query }) =>
  query?.role ? db.helpArticles.filter((item) => item.roles.includes(query.role)) : db.helpArticles
);

/* ------------------------------------------------------------------ entry */

export async function mockRouter(method, path, { params, body } = {}) {
  const match = matchRoute(method, path);
  if (!match) {
    throw new ApiError(`No mock handler for ${method} ${path}`, {
      status: 404,
      code: "no_mock_route",
      path,
    });
  }

  const result = match.handler({ params: { ...match.params, ...params }, body });
  return delay(result);
}
