import * as db from "@/mock";
import { respond } from "./http.mock";

export const getDashboard = () =>
  respond({
    cashflow: db.cashflow,
    expenses: db.expenses,
    incomeExpense: db.incomeExpense,
    patients: db.patientsSplit,
    popularTreatments: db.popularTreatments,
    stock: db.stockAvailability,
  });

export const getReportMetrics = () => respond(db.reportMetrics);
