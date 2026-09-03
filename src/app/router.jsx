import { Suspense, lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { CardSkeleton } from "@/components/ui/Skeleton";
import NotFoundPage from "@/features/misc/NotFoundPage";

/* Route-level code splitting keeps the initial bundle small. */
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const ReservationsPage = lazy(() => import("@/features/reservations/ReservationsPage"));
const PatientsPage = lazy(() => import("@/features/patients/PatientsPage"));
const TreatmentsPage = lazy(() => import("@/features/treatments/TreatmentsPage"));
const StaffPage = lazy(() => import("@/features/staff/StaffPage"));
const AccountsPage = lazy(() => import("@/features/accounts/AccountsPage"));
const SalesPage = lazy(() => import("@/features/sales/SalesPage"));
const PurchasesPage = lazy(() => import("@/features/purchases/PurchasesPage"));
const PaymentMethodsPage = lazy(() => import("@/features/paymentMethods/PaymentMethodsPage"));
const StocksPage = lazy(() => import("@/features/stocks/StocksPage"));
const PeripheralsPage = lazy(() => import("@/features/peripherals/PeripheralsPage"));
const ReportPage = lazy(() => import("@/features/report/ReportPage"));
const SupportPage = lazy(() => import("@/features/support/SupportPage"));

function Loading() {
  return (
    <div className="grid grid-cols-12 gap-5 p-6">
      <CardSkeleton className="col-span-12 xl:col-span-8" />
      <CardSkeleton className="col-span-12 xl:col-span-4" />
    </div>
  );
}

const page = (Component) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: page(DashboardPage) },
      { path: "reservations", element: page(ReservationsPage) },
      { path: "patients", element: page(PatientsPage) },
      { path: "treatments", element: page(TreatmentsPage) },
      { path: "staff", element: page(StaffPage) },
      { path: "accounts", element: page(AccountsPage) },
      { path: "sales", element: page(SalesPage) },
      { path: "purchases", element: page(PurchasesPage) },
      { path: "payment-methods", element: page(PaymentMethodsPage) },
      { path: "stocks", element: page(StocksPage) },
      { path: "peripherals", element: page(PeripheralsPage) },
      { path: "report", element: page(ReportPage) },
      { path: "support", element: page(SupportPage) },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
