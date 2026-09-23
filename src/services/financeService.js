import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const getAccounts = (params) => api.get(endpoints.finance.accounts, params);
export const getAccount = (id) => api.get(endpoints.finance.accountDetail(id));
export const createAccount = (body) => api.post(endpoints.finance.accounts, body);
export const updateAccount = (id, body) => api.patch(endpoints.finance.accountDetail(id), body);
export const setAccountActive = (id, active) =>
  api.patch(endpoints.finance.accountDetail(id), { active });

export const getTransactions = (params) => api.get(endpoints.finance.transactions, params);
export const transfer = (body) => api.post(endpoints.finance.transfer, body);

export const getBills = (params) => api.get(endpoints.finance.bills, params);
export const getBill = (id) => api.get(endpoints.finance.billDetail(id));
export const getBillComments = (id) => api.get(endpoints.finance.billComments(id));
export const addBillComment = (id, body) => api.post(endpoints.finance.billComments(id), body);

export const getPayments = (params) => api.get(endpoints.finance.payments, params);
export const takePayment = (body) => api.post(endpoints.finance.payments, body);

export const getPaymentMethods = () => api.get(endpoints.finance.paymentMethods);
export const setPaymentMethodEnabled = (id, enabled) =>
  api.patch(endpoints.finance.paymentMethod(id), { enabled });

export const getPurchases = (params) => api.get(endpoints.finance.purchases, params);
export const createPurchase = (body) => api.post(endpoints.finance.purchases, body);
export const updatePurchase = (id, body) => api.patch(endpoints.finance.purchaseDetail(id), body);

/**
 * Mark a purchase paid.
 *
 * Its own verb rather than a caller assembling `{ status: "PAID" }`, because
 * this is the transition that actually spends money: the server debits the
 * account named on the purchase and counts the expense against its category.
 * Naming the act keeps that consequence visible at the call site.
 */
export const payPurchase = (id) => api.patch(endpoints.finance.purchaseDetail(id), { status: "PAID" });

/**
 * The four tiles at the top of the sales screen.
 *
 * Composed here rather than fetched from one endpoint, and the reason is on the
 * server: `GET /finance/summary` is *deliberately* the pockets and nothing else,
 * because every other number on the finance screens is a fold over the counters
 * the owner's board already maintains — and two folds over the same month are
 * two numbers that can disagree, with no way for anybody to tell which one is
 * right. See the note above the handler in `routes/clinic/finance.owner.js`.
 *
 * This page used to call that endpoint expecting revenue and profit, got the
 * pockets, and crashed on `summary.revenue.total` — a shape mismatch that no
 * path-level contract check can see, because the path matched perfectly.
 *
 * So: the board for the three period figures, the takings endpoint for today's
 * cash. Both are cached server-side and read counters rather than rows, so this
 * is two cheap reads rather than a report.
 */
export async function getSummary() {
  const [board, takings] = await Promise.all([
    api.get(endpoints.owner.board),
    /* The till is counted against today and only today; a failure here must not
       cost the other three tiles. */
    api.get(endpoints.finance.takings).catch(() => null),
  ]);

  const kpis = board?.kpis ?? {};
  const figure = (value) => ({ total: value?.total ?? 0, change: value?.change ?? null });

  return {
    revenue: figure(kpis.revenue),
    profit: figure(kpis.profit),
    outstanding: figure(board?.outstanding),
    collected: { total: takings?.total ?? 0, change: null },
  };
}

/** Month-end: does every account's balance match the sum of its ledger? */
export const reconcile = (params) => api.get(endpoints.finance.reconcile, params);

/** The day's takings split by method — what the till is counted against. */
export const getTakings = (date) => api.get(endpoints.finance.takings, { date });
