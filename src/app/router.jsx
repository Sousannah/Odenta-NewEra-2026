import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ROUTE_PERMISSIONS } from "@/config/navigation";
import { ROLES } from "@/auth/roles";
import { RequireAuth, RequirePermission, RequireRole, RoleHomeRedirect } from "./guards";
import NotFoundPage from "@/features/misc/NotFoundPage";
import RouteErrorPage from "@/features/misc/RouteErrorPage";

const SignInPage = lazy(() => import("@/auth/SignInPage"));

/* role dashboards */
const OwnerDashboard = lazy(() => import("@/roles/owner/OwnerDashboard"));
const ManagerDashboard = lazy(() => import("@/roles/manager/ManagerDashboard"));
const DentistDashboard = lazy(() => import("@/roles/dentist/DentistDashboard"));
const AssistantDashboard = lazy(() => import("@/roles/assistant/AssistantDashboard"));
const ReceptionDashboard = lazy(() => import("@/roles/receptionist/ReceptionDashboard"));
const FinanceDashboard = lazy(() => import("@/roles/accountant/FinanceDashboard"));
const LabDashboard = lazy(() => import("@/roles/labtech/LabDashboard"));

/* shared feature screens */
const SchedulePage = lazy(() => import("@/features/schedule/SchedulePage"));
const PatientsPage = lazy(() => import("@/features/patients/PatientsPage"));
const PatientDetailPage = lazy(() => import("@/features/patients/PatientDetailPage"));
const RecallsPage = lazy(() => import("@/features/recalls/RecallsPage"));
const TreatmentsPage = lazy(() => import("@/features/treatments/TreatmentsPage"));
const StaffPage = lazy(() => import("@/features/staff/StaffPage"));
const TreatmentPlansPage = lazy(() => import("@/features/plans/TreatmentPlansPage"));
const LabCasesPage = lazy(() => import("@/features/lab/LabCasesPage"));
const SterilisationPage = lazy(() => import("@/features/sterilisation/SterilisationPage"));
const AccountsPage = lazy(() => import("@/features/accounts/AccountsPage"));
const SalesPage = lazy(() => import("@/features/sales/SalesPage"));
const PurchasesPage = lazy(() => import("@/features/purchases/PurchasesPage"));
const PaymentMethodsPage = lazy(() => import("@/features/paymentMethods/PaymentMethodsPage"));
const StocksPage = lazy(() => import("@/features/stocks/StocksPage"));
const PeripheralsPage = lazy(() => import("@/features/peripherals/PeripheralsPage"));
const ReportPage = lazy(() => import("@/features/report/ReportPage"));
const AuditPage = lazy(() => import("@/features/audit/AuditPage"));
const SupportPage = lazy(() => import("@/features/support/SupportPage"));

function Loading() {
  return (
    <div className="grid grid-cols-12 gap-5 p-6">
      <CardSkeleton className="col-span-12 xl:col-span-8" />
      <CardSkeleton className="col-span-12 xl:col-span-4" />
    </div>
  );
}

const lazyPage = (Component) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
);

/**
 * Child routes carry their own errorElement so a crash renders inside the
 * app shell — the sidebar and top bar stay usable instead of the whole
 * layout being replaced by an error screen.
 */
const roleDashboard = (path, role, Component) => ({
  path,
  element: <RequireRole role={role}>{lazyPage(Component)}</RequireRole>,
  errorElement: <RouteErrorPage />,
});

/** A protected route: permission from the central map, then the screen. */
const guarded = (path, Component) => ({
  path,
  element: (
    <RequirePermission permission={ROUTE_PERMISSIONS[path]}>
      {lazyPage(Component)}
    </RequirePermission>
  ),
  errorElement: <RouteErrorPage />,
});

export const router = createBrowserRouter([
  {
    path: "/sign-in",
    element: lazyPage(SignInPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <RoleHomeRedirect /> },

      /* role dashboards — one route per role, each locked to that role */
      roleDashboard("owner", ROLES.OWNER, OwnerDashboard),
      roleDashboard("manager", ROLES.MANAGER, ManagerDashboard),
      roleDashboard("dentist", ROLES.DENTIST, DentistDashboard),
      roleDashboard("assistant", ROLES.ASSISTANT, AssistantDashboard),
      roleDashboard("front-desk", ROLES.RECEPTIONIST, ReceptionDashboard),
      roleDashboard("finance", ROLES.ACCOUNTANT, FinanceDashboard),
      roleDashboard("lab", ROLES.LAB_TECH, LabDashboard),

      /* shared screens */
      guarded("/schedule", SchedulePage),
      guarded("/patients", PatientsPage),
      {
        path: "/patients/:patientId",
        element: (
          <RequirePermission permission={ROUTE_PERMISSIONS["/patients"]}>
            {lazyPage(PatientDetailPage)}
          </RequirePermission>
        ),
        errorElement: <RouteErrorPage />,
      },
      guarded("/recalls", RecallsPage),
      guarded("/treatments", TreatmentsPage),
      guarded("/staff", StaffPage),
      guarded("/treatment-plans", TreatmentPlansPage),
      guarded("/lab-cases", LabCasesPage),
      guarded("/sterilisation", SterilisationPage),
      guarded("/accounts", AccountsPage),
      guarded("/sales", SalesPage),
      guarded("/purchases", PurchasesPage),
      guarded("/payment-methods", PaymentMethodsPage),
      guarded("/stocks", StocksPage),
      guarded("/peripherals", PeripheralsPage),
      guarded("/report", ReportPage),
      guarded("/audit", AuditPage),
      guarded("/support", SupportPage),

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
