/**
 * Every server path the app knows about, in one place.
 *
 * Functions rather than template strings at the call site so a path change is
 * a single edit, and so the mock router and the real client agree on shape.
 */
export const endpoints = {
  auth: {
    session: "/auth/session",
    signIn: "/auth/sign-in",
    signOut: "/auth/sign-out",
  },

  clinic: {
    current: "/clinic",
    branches: "/clinic/branches",
  },

  staff: {
    list: "/staff",
    detail: (id) => `/staff/${id}`,
    dentists: "/staff/dentists",
    rota: "/staff/rota",
  },

  patients: {
    list: "/patients",
    detail: (id) => `/patients/${id}`,
    clinical: (id) => `/patients/${id}/clinical`,
    chart: (id) => `/patients/${id}/chart`,
    perio: (id) => `/patients/${id}/perio`,
    plans: (id) => `/patients/${id}/treatment-plans`,
    appointments: (id) => `/patients/${id}/appointments`,
    prescriptions: (id) => `/patients/${id}/prescriptions`,
    attachments: (id) => `/patients/${id}/attachments`,
  },

  appointments: {
    list: "/appointments",
    detail: (id) => `/appointments/${id}`,
    log: "/appointments/log",
    waitlist: "/appointments/waitlist",
  },

  treatments: {
    list: "/treatments",
    detail: (id) => `/treatments/${id}`,
  },

  finance: {
    accounts: "/finance/accounts",
    accountDetail: (id) => `/finance/accounts/${id}`,
    transactions: "/finance/transactions",
    transfer: "/finance/transfer",
    bills: "/finance/bills",
    billDetail: (id) => `/finance/bills/${id}`,
    billComments: (id) => `/finance/bills/${id}/comments`,
    payments: "/finance/payments",
    paymentMethods: "/finance/payment-methods",
    purchases: "/finance/purchases",
    summary: "/finance/summary",
  },

  inventory: {
    stocks: "/inventory/stocks",
    stockOrders: "/inventory/stock-orders",
    peripherals: "/inventory/peripherals",
  },

  lab: {
    cases: "/lab/cases",
    caseDetail: (id) => `/lab/cases/${id}`,
  },

  sterilization: {
    cycles: "/sterilization/cycles",
  },

  rooms: {
    list: "/rooms",
  },

  recalls: {
    list: "/recalls",
  },

  analytics: {
    dashboard: (role) => `/analytics/dashboard/${role}`,
    report: "/analytics/report",
  },

  audit: {
    list: "/audit",
  },

  support: {
    threads: "/support/threads",
    articles: "/support/articles",
  },
};
