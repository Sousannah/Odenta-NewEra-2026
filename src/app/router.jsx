import { Suspense, lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { UniversityLayout } from "@/university/layout/UniversityLayout";
import { SiteLayout } from "@/site/layout/SiteLayout";
import { SiteLoading } from "@/site/components/SiteLoading";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { ROUTE_PERMISSIONS } from "@/config/navigation";
import { UNIVERSITY_ROUTE_PERMISSIONS } from "@/config/universityNavigation";
import { APP_BASE, UNI_BASE, app, auth, platform, site, uni } from "@/config/paths";
import { PORTALS, ROLES } from "@/auth/roles";
import { RequireAuth, RequirePermission, RequirePortal, RequireRole, RoleHomeRedirect } from "./guards";
import NotFoundPage from "@/features/misc/NotFoundPage";
import RouteErrorPage from "@/features/misc/RouteErrorPage";

const SignInPage = lazy(() => import("@/auth/SignInPage"));

/* The two credential screens. Both sit outside the portal shells — see the
   routes below for why. */
const ActivatePage = lazy(() => import("@/auth/ActivatePage"));
const ChangePasswordPage = lazy(() => import("@/auth/ChangePasswordPage"));

/* public marketing site */
const HomePage = lazy(() => import("@/site/pages/HomePage"));
const ServicesPage = lazy(() => import("@/site/pages/ServicesPage"));
const UniversityServicesPage = lazy(() => import("@/site/pages/UniversityServicesPage"));
const UniversitiesPage = lazy(() => import("@/site/pages/UniversitiesPage"));
const UniversityDetailPage = lazy(() => import("@/site/pages/UniversityDetailPage"));
const BookAppointmentPage = lazy(() => import("@/site/pages/BookAppointmentPage"));
const BookingConfirmationPage = lazy(() => import("@/site/pages/BookingConfirmationPage"));
const ClinicsPage = lazy(() => import("@/site/pages/ClinicsPage"));
const AboutPage = lazy(() => import("@/site/pages/AboutPage"));
const ContactPage = lazy(() => import("@/site/pages/ContactPage"));
const DemoPage = lazy(() => import("@/site/pages/DemoPage"));
const TryAiPage = lazy(() => import("@/site/pages/TryAiPage"));
const PricingPage = lazy(() => import("@/site/pages/PricingPage"));
const LegalPage = lazy(() => import("@/site/pages/LegalPage"));
const SiteNotFoundPage = lazy(() => import("@/site/pages/SiteNotFoundPage"));
const PatientCardPage = lazy(() => import("@/site/pages/PatientCardPage"));

/* clinic role dashboards */
const OwnerDashboard = lazy(() => import("@/roles/owner/OwnerDashboard"));
const DentistDashboard = lazy(() => import("@/roles/dentist/DentistDashboard"));
const AssistantDashboard = lazy(() => import("@/roles/assistant/AssistantDashboard"));
const ReceptionDashboard = lazy(() => import("@/roles/receptionist/ReceptionDashboard"));

/* clinic feature screens */
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

/* university role dashboards */
const StudentDashboard = lazy(() => import("@/university/student/StudentDashboard"));
const SupervisorDashboard = lazy(() => import("@/university/supervisor/SupervisorDashboard"));
const UniversityAdminDashboard = lazy(() => import("@/university/roles/admin/UniversityAdminDashboard"));
const ClinicDeskDashboard = lazy(() => import("@/university/assistant/ClinicDeskDashboard"));
const ITDashboard = lazy(() => import("@/university/roles/it/ITDashboard"));
const PlatformDashboard = lazy(() => import("@/university/roles/platform/PlatformDashboard"));

/* university feature screens */
const UniCasesPage = lazy(() => import("@/university/features/cases/CasesPage"));
const UniCaseDetailPage = lazy(() => import("@/university/features/cases/CaseDetailPage"));
const UniPatientCardsPage = lazy(() => import("@/university/features/cases/PatientCardsPage"));
const UniSessionsPage = lazy(() => import("@/university/features/schedule/ClinicSessionsPage"));
const UniIntakePage = lazy(() => import("@/university/features/appointments/IntakePage"));
const UniMyReviewsPage = lazy(() => import("@/university/features/reviews/MyReviewsPage"));
const UniReviewQueuePage = lazy(() => import("@/university/features/reviews/ReviewQueuePage"));
const UniStudentsPage = lazy(() => import("@/university/features/students/StudentsPage"));
const UniStudentDetailPage = lazy(() => import("@/university/features/students/StudentDetailPage"));
const UniRequirementsPage = lazy(() => import("@/university/features/requirements/RequirementsPage"));
const UniProcedureRequestsPage = lazy(() => import("@/university/features/requests/ProcedureRequestsPage"));
const UniLabRequestsPage = lazy(() => import("@/university/features/lab/LabRequestsPage"));
const UniPeoplePage = lazy(() => import("@/university/features/people/PeoplePage"));
const UniAnnouncementsPage = lazy(() => import("@/university/features/news/AnnouncementsPage"));
const UniActivityPage = lazy(() => import("@/university/features/activity/ActivityPage"));
const UniAccountsPage = lazy(() => import("@/university/features/accounts/AccountsPage"));
const UniBulkCreatePage = lazy(() => import("@/university/features/accounts/BulkCreatePage"));
const UniCampusesPage = lazy(() => import("@/university/features/platform/CampusesPage"));
const UniPartnerClinicsPage = lazy(() => import("@/university/features/platform/PartnerClinicsPage"));

/**
 * The platform console.
 *
 * Lazy like every other screen, and that matters more here than elsewhere: this
 * is ten screens that exactly one account will ever open, so bundling them into
 * the university chunk would make every student's first load carry the
 * founders' billing screen.
 */
const PlatformTenantsPage = lazy(() => import("@/university/features/platform/TenantsPage"));
const PlatformTenantDetailPage = lazy(() => import("@/university/features/platform/TenantDetailPage"));
const PlatformAccountsPage = lazy(() => import("@/university/features/platform/PlatformAccountsPage"));
const PlatformAnalyticsPage = lazy(() => import("@/university/features/platform/PlatformAnalyticsPage"));
const PlatformSecurityPage = lazy(() => import("@/university/features/platform/SecurityCenterPage"));
const PlatformServersPage = lazy(() => import("@/university/features/platform/ServersPage"));
const PlatformBillingPage = lazy(() => import("@/university/features/platform/BillingPage"));
const PlatformAuditPage = lazy(() => import("@/university/features/platform/AuditTrailPage"));
const PlatformRolesPage = lazy(() => import("@/university/features/platform/RolesPage"));
const PlatformSettingsPage = lazy(() => import("@/university/features/platform/PlatformSettingsPage"));
const UniAnalyticsPage = lazy(() => import("@/university/features/analytics/AnalyticsPage"));
const UniReportsPage = lazy(() => import("@/university/features/reports/ReportsPage"));

/* the student clinic — the patient record and everything a student opens */
const StudentPatientsPage = lazy(() => import("@/university/student/MyPatientsPage"));
const StudentCalendarPage = lazy(() => import("@/university/student/StudentCalendarPage"));
const StudentLabPage = lazy(() => import("@/university/student/StudentLabPage"));
const StudentPerformancePage = lazy(() => import("@/university/student/PerformancePage"));
const StudentLearningHubPage = lazy(() => import("@/university/student/LearningHubPage"));
const StudentProfilePage = lazy(() => import("@/university/student/StudentProfilePage"));

/* the clinic desk */
const PatientRegistryPage = lazy(() => import("@/university/assistant/PatientRegistryPage"));

/* the faculty surface */
const PatientDossierPage = lazy(() => import("@/university/supervisor/PatientDossierPage"));
const SignaturePage = lazy(() => import("@/university/supervisor/SignaturePage"));

const PatientRecordLayout = lazy(() => import("@/university/student/PatientRecordLayout"));
const PatientSheetsPage = lazy(() => import("@/university/student/PatientSheetsPage"));
const PatientMedicalPage = lazy(() => import("@/university/student/PatientMedicalPage"));
const PatientHistoryPage = lazy(() => import("@/university/student/PatientHistoryPage"));
const PatientToothChartPage = lazy(() => import("@/university/student/ToothChartPage"));
const PatientGalleryPage = lazy(() => import("@/university/student/PatientGalleryPage"));
const PatientXRayPage = lazy(() => import("@/university/student/PatientXRayPage"));
const PatientAppointmentsPage = lazy(() => import("@/university/student/PatientAppointmentsPage"));
const PatientConsentPage = lazy(() => import("@/university/student/PatientConsentPage"));
const PatientReviewStepsPage = lazy(() => import("@/university/student/ReviewStepsPage"));
const PatientLabPage = lazy(() => import("@/university/student/PatientLabPage"));
const PatientSubmittedReviewsPage = lazy(() => import("@/university/student/SubmittedReviewsPage"));

/** Every portal screen waits behind the same wordmark loader. */
function Loading() {
  return <OdentaLoaderPanel />;
}

const lazyPage = (Component) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
);

/** Marketing screens get the same loader with the site's own framing. */
const lazySitePage = (Component, props) => (
  <Suspense fallback={<SiteLoading />}>
    <Component {...props} />
  </Suspense>
);

const publicRoute = (path, Component, props) => ({
  path,
  element: lazySitePage(Component, props),
  errorElement: <RouteErrorPage />,
});

/**
 * Child routes carry their own errorElement so a crash renders inside the
 * app shell — the sidebar and top bar stay usable instead of the whole
 * layout being replaced by an error screen.
 *
 * `role` may be a list for a board with more than one legitimate audience.
 */
const roleDashboard = (path, role, Component) => ({
  path,
  element: <RequireRole role={role}>{lazyPage(Component)}</RequireRole>,
  errorElement: <RouteErrorPage />,
});

/**
 * A protected route: permission from the central map, then the screen.
 *
 * No portal guard here — the whole `/app` branch is wrapped in one, so every
 * clinic route inherits it and none of them can be the one that forgot.
 */
const guarded = (path, Component) => ({
  path,
  element: (
    <RequirePermission permission={ROUTE_PERMISSIONS[path]}>
      {lazyPage(Component)}
    </RequirePermission>
  ),
  errorElement: <RouteErrorPage />,
});

/**
 * A campus route: the university shell, then the permission, then the screen.
 *
 * The portal guard is per-route on this side rather than on the branch, and the
 * reason is a piece of history worth stating: the platform console's ten screens
 * are children of the *same* route as the campus screens, because they are
 * served from `/university-portal/platform/*`. One guard on the branch would
 * therefore have to admit both portals, which is how "the platform account is a
 * university member" became true in the first place.
 *
 * Two helpers, two portals, and a route belongs to exactly one of them.
 */
const uniGuarded = (path, Component, permissionPath = path) => ({
  path,
  element: (
    <RequirePortal portal={PORTALS.UNIVERSITY}>
      <RequirePermission permission={UNIVERSITY_ROUTE_PERMISSIONS[permissionPath]}>
        {lazyPage(Component)}
      </RequirePermission>
    </RequirePortal>
  ),
  errorElement: <RouteErrorPage />,
});

/** A console route. Same shape, the other portal. */
const platformGuarded = (path, Component, permissionPath = path) => ({
  path,
  element: (
    <RequirePortal portal={PORTALS.PLATFORM}>
      <RequirePermission permission={UNIVERSITY_ROUTE_PERMISSIONS[permissionPath]}>
        {lazyPage(Component)}
      </RequirePermission>
    </RequirePortal>
  ),
  errorElement: <RouteErrorPage />,
});

export const router = createBrowserRouter([
  /* ------------------------------------------------- public Odenta site */
  {
    element: <SiteLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      publicRoute(site.home, HomePage),
      publicRoute(site.services, ServicesPage),
      publicRoute(site.universityServices, UniversityServicesPage),
      publicRoute(site.universities, UniversitiesPage),
      publicRoute("/universities/:universityId", UniversityDetailPage),
      publicRoute(site.book, BookAppointmentPage),
      publicRoute(site.bookingConfirmation, BookingConfirmationPage),
      publicRoute(site.clinics, ClinicsPage),
      publicRoute(site.about, AboutPage),
      publicRoute(site.contact, ContactPage),
      publicRoute(site.demo, DemoPage),
      publicRoute(site.tryAi, TryAiPage),
      publicRoute(site.pricing, PricingPage),
      publicRoute(site.privacy, LegalPage, { document: "privacy" }),
      publicRoute(site.terms, LegalPage, { document: "terms" }),
      { path: "*", element: lazySitePage(SiteNotFoundPage) },
    ],
  },

  /**
   * A patient card, opened from the QR printed on it.
   *
   * Top level rather than inside the marketing shell: this is reached by
   * pointing a phone at a piece of card, and the person doing it wants the
   * card, not a site header offering them a free consultation. Public by
   * necessity — the token in the path is the only credential anybody
   * scanning it has.
   */
  {
    path: site.card(":token"),
    element: lazyPage(PatientCardPage),
    errorElement: <RouteErrorPage />,
  },

  /* ------------------------------------------------------------ sign in */
  {
    path: auth.signIn,
    element: lazyPage(SignInPage),
    errorElement: <RouteErrorPage />,
  },

  /**
   * Redeeming an invitation.
   *
   * Public by necessity and outside both portal shells: the person following
   * the link has no session yet, and the token in the query string is the only
   * thing that authorises them. The server signs them in once they choose a
   * password, so this is the one route that *creates* a session without going
   * through the sign-in form.
   */
  {
    path: auth.activate,
    element: lazyPage(ActivatePage),
    errorElement: <RouteErrorPage />,
  },

  /**
   * Setting a new password.
   *
   * Signed in, but deliberately outside both shells — somebody sent here is
   * holding a credential an administrator issued, and `RequireAuth` redirects
   * every other route to this one until they have replaced it. A sidebar and a
   * dashboard around that form would invite them to navigate away from the one
   * thing they have to finish.
   */
  {
    path: auth.changePassword,
    element: (
      <RequireAuth>
        {lazyPage(ChangePasswordPage)}
      </RequireAuth>
    ),
    errorElement: <RouteErrorPage />,
  },

  /* --------------------------------------------------- signed-in portal */
  {
    path: APP_BASE,
    element: (
      <RequireAuth>
        {/**
         * One portal guard for the whole practice branch.
         *
         * Above `AppLayout` rather than inside each route, because the leak this
         * closes is the *shell*: the clinic sidebar, the practice card and the
         * clinic vocabulary used to render for anybody whose URL started
         * `/app`, including the platform account. Guarding the layout means a
         * non-clinic role never mounts it at all.
         */}
        <RequirePortal portal={PORTALS.CLINIC}>
          <AppLayout />
        </RequirePortal>
      </RequireAuth>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <RoleHomeRedirect /> },

      /* role dashboards — one route per role, each locked to that role */
      /**
       * The owner's board, and one role only.
       *
       * This used to read `[ROLES.OWNER, ROLES.SUPERADMIN]` — the platform
       * account's landing spot inside a practice, on the reasoning that a second
       * copy of the same numbers under a different title would be waste. What it
       * actually bought was the founders' account standing in a tenant's shell
       * with the tenant's navigation, which is the defect this work fixed. A
       * platform operator reads a practice's numbers on the Insights console and
       * sees its screens through an audited preview.
       */
      roleDashboard("owner", ROLES.OWNER, OwnerDashboard),
      roleDashboard("dentist", ROLES.DENTIST, DentistDashboard),
      roleDashboard("assistant", ROLES.ASSISTANT, AssistantDashboard),
      roleDashboard("front-desk", ROLES.RECEPTIONIST, ReceptionDashboard),

      /* shared screens */
      guarded(app.schedule, SchedulePage),
      guarded(app.patients, PatientsPage),
      {
        path: `${app.patients}/:patientId`,
        element: (
          <RequirePermission permission={ROUTE_PERMISSIONS[app.patients]}>
            {lazyPage(PatientDetailPage)}
          </RequirePermission>
        ),
        errorElement: <RouteErrorPage />,
      },
      guarded(app.recalls, RecallsPage),
      guarded(app.treatments, TreatmentsPage),
      guarded(app.staff, StaffPage),
      guarded(app.treatmentPlans, TreatmentPlansPage),
      guarded(app.labCases, LabCasesPage),
      guarded(app.sterilisation, SterilisationPage),
      guarded(app.accounts, AccountsPage),
      guarded(app.sales, SalesPage),
      guarded(app.purchases, PurchasesPage),
      guarded(app.paymentMethods, PaymentMethodsPage),
      guarded(app.stocks, StocksPage),
      guarded(app.peripherals, PeripheralsPage),
      guarded(app.report, ReportPage),
      guarded(app.audit, AuditPage),
      guarded(app.support, SupportPage),

      { path: "*", element: <NotFoundPage /> },
    ],
  },

  /* ------------------------------------------------- university portal */
  {
    path: UNI_BASE,
    element: (
      <RequireAuth>
        <UniversityLayout />
      </RequireAuth>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <RoleHomeRedirect /> },

      roleDashboard("student", ROLES.UNI_STUDENT, StudentDashboard),
      roleDashboard("supervisor", ROLES.UNI_SUPERVISOR, SupervisorDashboard),
      roleDashboard("admin", ROLES.UNI_ADMIN, UniversityAdminDashboard),
      roleDashboard("clinic-desk", ROLES.UNI_ASSISTANT, ClinicDeskDashboard),
      roleDashboard("it", ROLES.UNI_IT, ITDashboard),
      roleDashboard("platform", ROLES.SUPERADMIN, PlatformDashboard),

      /* clinical */
      uniGuarded(uni.cases, UniCasesPage),
      uniGuarded(`${uni.cases}/:caseId`, UniCaseDetailPage, uni.cases),
      uniGuarded(uni.patientCards, UniPatientCardsPage),
      uniGuarded(uni.schedule, UniSessionsPage),
      uniGuarded(uni.procedureRequests, UniProcedureRequestsPage),
      uniGuarded(uni.labRequests, UniLabRequestsPage),

      /* ------------------------------------------------ the student clinic */
      uniGuarded(uni.myPatients, StudentPatientsPage),
      uniGuarded(uni.calendar, StudentCalendarPage),
      uniGuarded(uni.studentLab, StudentLabPage),
      uniGuarded(uni.performance, StudentPerformancePage),
      uniGuarded(uni.learning, StudentLearningHubPage),
      uniGuarded(uni.profile, StudentProfilePage),

      /**
       * The patient record.
       *
       * A layout route: the identity strip and tab bar are fetched once and
       * every tab renders inside them, so moving between chart and consent
       * never re-fetches the patient or loses the medical alerts.
       */
      {
        path: `${uni.patient(":nationalId")}`,
        element: (
          <RequirePermission permission={UNIVERSITY_ROUTE_PERMISSIONS["patient-record"]}>
            {lazyPage(PatientRecordLayout)}
          </RequirePermission>
        ),
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <Navigate to="medical" replace /> },
          { path: "sheets", element: lazyPage(PatientSheetsPage) },
          { path: "medical", element: lazyPage(PatientMedicalPage) },
          { path: "history", element: lazyPage(PatientHistoryPage) },
          { path: "chart", element: lazyPage(PatientToothChartPage) },
          { path: "gallery", element: lazyPage(PatientGalleryPage) },
          { path: "xrays", element: lazyPage(PatientXRayPage) },
          { path: "appointments", element: lazyPage(PatientAppointmentsPage) },
          { path: "consent", element: lazyPage(PatientConsentPage) },
          { path: "review-steps", element: lazyPage(PatientReviewStepsPage) },
          { path: "lab", element: lazyPage(PatientLabPage) },
          { path: "reviews", element: lazyPage(PatientSubmittedReviewsPage) },
        ],
      },

      /* teaching */
      uniGuarded(uni.reviews, UniMyReviewsPage),
      uniGuarded(uni.reviewQueue, UniReviewQueuePage),
      uniGuarded(uni.signature, SignaturePage),
      /* the dossier is addressed by the number on the patient's card, like the
         student's record — it is the same person read from the other side. */
      uniGuarded(uni.dossier(":nationalId"), PatientDossierPage, "patient-dossier"),
      uniGuarded(uni.students, UniStudentsPage),
      uniGuarded(`${uni.students}/:studentId`, UniStudentDetailPage, uni.students),
      uniGuarded(uni.requirements, UniRequirementsPage),

      /* administration */
      uniGuarded(uni.people, UniPeoplePage),
      uniGuarded(uni.appointments, UniIntakePage),
      uniGuarded(uni.registry, PatientRegistryPage),
      uniGuarded(uni.activity, UniActivityPage),
      uniGuarded(uni.news, UniAnnouncementsPage),

      /* campus IT */
      uniGuarded(uni.accounts, UniAccountsPage),
      uniGuarded(uni.bulkCreate, UniBulkCreatePage),
      uniGuarded(uni.campuses, UniCampusesPage),
      uniGuarded(uni.partnerClinics, UniPartnerClinicsPage),

      /**
       * ---------------------------------------------- the platform console
       *
       * Every route is gated on an `SA` permission that exactly one role holds,
       * and the same permission gates the endpoint behind it on the server — so
       * a URL typed by hand is refused by the same rule that hides the link.
       * The route dashboard above (`roleDashboard("platform", …)`) is the
       * command centre and shares this prefix; React Router matches the more
       * specific path first, so the two do not collide.
       */
      platformGuarded(platform.tenants, PlatformTenantsPage),
      platformGuarded(platform.tenant(":tenantId"), PlatformTenantDetailPage, "platform-tenant"),
      platformGuarded(platform.accounts, PlatformAccountsPage),
      platformGuarded(platform.analytics, PlatformAnalyticsPage),
      platformGuarded(platform.security, PlatformSecurityPage),
      platformGuarded(platform.servers, PlatformServersPage),
      platformGuarded(platform.billing, PlatformBillingPage),
      platformGuarded(platform.activity, PlatformAuditPage),
      platformGuarded(platform.roles, PlatformRolesPage),
      platformGuarded(platform.settings, PlatformSettingsPage),
      /* The console's own Support address — see `config/paths.js` for why the
         platform account cannot use the campus one. */
      platformGuarded(platform.support, SupportPage),

      /* footer */
      uniGuarded(uni.analytics, UniAnalyticsPage),
      uniGuarded(uni.reports, UniReportsPage),
      uniGuarded(uni.support, SupportPage),

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
