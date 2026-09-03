import * as db from "@/mock";
import { respond, search } from "./http.mock";

export const getAccounts = () => respond(db.accounts);

export const getAccountTransactions = (accountId) =>
  respond(
    db.accountTransactions.filter((t) => !accountId || t.accountId === accountId)
  );

export const getBills = ({ query = "" } = {}) =>
  respond(search(db.bills, query, ["id", "patient", "reservationId"]));

export const getBillById = (id) => respond(db.bills.find((b) => b.id === id) ?? null);

export const getBillComments = (billId) =>
  respond(db.billComments.filter((c) => c.billId === billId));

export const getPaymentsReceived = ({ query = "" } = {}) =>
  respond(search(db.paymentsReceived, query, ["id", "patient", "billId", "method"]));

export const getPaymentMethods = () => respond(db.paymentMethods);

export const getPurchases = ({ status = "all", query = "" } = {}) => {
  const rows =
    status === "all" ? db.purchases : db.purchases.filter((p) => p.status === status);
  return respond(search(rows, query, ["id", "vendor", "category", "account"]));
};

export const getSalesSummary = () => respond(db.salesSummary);
