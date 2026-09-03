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
  api.patch(endpoints.finance.paymentMethods + "/" + id, { enabled });

export const getPurchases = (params) => api.get(endpoints.finance.purchases, params);
export const getSummary = () => api.get(endpoints.finance.summary);
