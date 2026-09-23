import {
  Activity,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  ClipboardPlus,
  FlaskConical,
  GraduationCap,
  Headphones,
  IdCard,
  LayoutDashboard,
  Megaphone,
  PieChart,
  ScrollText,
  Target,
  TrendingUp,
  UserCog,
  UserPlus,
  Users,
  UsersRound,
  UserSquare2,
} from "lucide-react";
import { P, UP } from "@/auth/permissions";
import { roleDashboards, uni } from "@/config/paths";
import { ROLES } from "@/auth/roles";

/**
 * The five teaching-portal sidebars, one role at a time.
 *
 * Transcribed faithfully from what the old permission filter produced for each
 * role, including the two `only:` / `except:` overrides it carried — which is
 * the clearest argument for this shape. Those overrides existed because a pure
 * permission filter gave the wrong answer twice: the clinic desk holds
 * `CASE_VIEW_ALL` but reads those people as a *registry* rather than a case
 * list, and a staff member holds it too but their sidebar is the sessions they
 * teach. Both were patched with a role exception bolted onto a role-blind
 * mechanism. Written per role, they are simply what each list says.
 */

const dashboard = (to) => ({ key: "dashboard", label: "Dashboard", to, icon: LayoutDashboard });

const support = { key: "support", label: "Support", to: uni.support, icon: Headphones, permission: P.SUPPORT_VIEW };
const analytics = { key: "analytics", label: "Analytics", to: uni.analytics, icon: PieChart, permission: UP.UNI_ANALYTICS_VIEW };
const reports = { key: "reports", label: "Reports", to: uni.reports, icon: ScrollText, permission: UP.UNI_REPORT_VIEW };
const announcements = { key: "news", label: "Announcements", to: uni.news, icon: Megaphone, permission: UP.NEWS_VIEW };

/* --------------------------------------------------------------- student */

/**
 * A student works one patient over and over.
 *
 * "Patients" points at their own caseload addressed as records rather than case
 * rows, because that is the shape they work in chairside — they open the same
 * person repeatedly and move between sheet, chart, gallery and consent. The
 * faculty "Cases" list is a different screen and is not here: it is gated on
 * `CASE_VIEW_ALL`, which a student must never hold.
 *
 * The My Study group is the whole reason a student opens the portal outside
 * clinic hours, and every entry in it is gated on `REVIEW_SUBMIT` — the
 * permission that means "I am the one being signed off", which is exactly who
 * the group is for.
 */
const student = {
  sections: [
    { group: null, items: [dashboard(roleDashboards.uni_student)] },
    {
      group: "Clinic",
      items: [
        { key: "my-patients", label: "Patients", to: uni.myPatients, icon: UsersRound, permission: UP.CASE_VIEW_OWN },
        { key: "patient-cards", label: "Patient Cards", to: uni.patientCards, icon: IdCard, permission: UP.CASE_VIEW_OWN },
        { key: "calendar", label: "Calendar", to: uni.calendar, icon: CalendarRange, permission: UP.REVIEW_SUBMIT },
        { key: "schedule", label: "Clinic Sessions", to: uni.schedule, icon: CalendarDays, permission: UP.UNI_APPOINTMENT_VIEW },
        { key: "procedure-requests", label: "Procedure Requests", to: uni.procedureRequests, icon: ClipboardList, permission: UP.PROCEDURE_REQUEST_VIEW },
        { key: "student-lab", label: "Lab", to: uni.studentLab, icon: FlaskConical, permission: UP.UNI_LAB_REQUEST },
      ],
    },
    {
      group: "Teaching",
      items: [
        { key: "reviews", label: "My Reviews", to: uni.reviews, icon: ClipboardList, permission: UP.REVIEW_VIEW_OWN },
        { key: "requirements", label: "Requirements", to: uni.requirements, icon: Target, permission: UP.REQUIREMENT_VIEW },
      ],
    },
    {
      group: "My Study",
      items: [
        { key: "performance", label: "My Performance", to: uni.performance, icon: TrendingUp, permission: UP.REVIEW_SUBMIT },
        { key: "learning", label: "Learning Hub", to: uni.learning, icon: BookOpen, permission: UP.REVIEW_SUBMIT },
        { key: "profile", label: "My Profile", to: uni.profile, icon: UserCog, permission: UP.REVIEW_SUBMIT },
      ],
    },
    { group: "Administration", items: [announcements] },
  ],
  footer: [analytics, support],
};

/* ------------------------------------------------------------ supervisor */

/**
 * The staff member who signs work off.
 *
 * No case browser and no patient cards, and that is the old `except:` override
 * written as an absence instead. A supervisor holds `CASE_VIEW_ALL` — a review
 * row links straight into a record and the route guard still resolves it — but
 * their sidebar is the queue and the sessions they teach, because browsing a
 * campus's patients is not a thing this job does.
 */
const supervisor = {
  sections: [
    { group: null, items: [dashboard(roleDashboards.uni_supervisor)] },
    {
      group: "Clinic",
      items: [
        { key: "calendar", label: "Calendar", to: uni.calendar, icon: CalendarRange, permission: UP.UNI_APPOINTMENT_VIEW },
        { key: "schedule", label: "Clinic Sessions", to: uni.schedule, icon: CalendarDays, permission: UP.UNI_APPOINTMENT_VIEW },
        { key: "lab-requests", label: "Lab Requests", to: uni.labRequests, icon: FlaskConical, permission: UP.UNI_LAB_DECIDE },
      ],
    },
    {
      group: "Teaching",
      items: [
        { key: "review-queue", label: "Review Queue", to: uni.reviewQueue, icon: BadgeCheck, permission: UP.REVIEW_VIEW_ALL },
        { key: "students", label: "Students", to: uni.students, icon: GraduationCap, permission: UP.STUDENT_VIEW },
        { key: "requirements", label: "Requirements", to: uni.requirements, icon: Target, permission: UP.REQUIREMENT_VIEW },
      ],
    },
    { group: "Administration", items: [announcements] },
  ],
  footer: [analytics, reports, support],
};

/* ------------------------------------------------------------------ dean */

/**
 * The faculty's head. Oversight rather than operation.
 *
 * Reads whether the school is working — throughput, rotation load, who is
 * behind — and acts on the roster and the noticeboard when it is not. The role
 * key stays `uni_admin`; see `auth/roles.js` for why a label is not worth a
 * migration.
 */
const dean = {
  sections: [
    { group: null, items: [dashboard(roleDashboards.uni_admin)] },
    {
      group: "Clinic",
      items: [
        { key: "cases", label: "Cases", to: uni.cases, icon: UserSquare2, permission: UP.CASE_VIEW_ALL },
        { key: "patient-cards", label: "Patient Cards", to: uni.patientCards, icon: IdCard, permission: UP.CASE_VIEW_ALL },
        { key: "calendar", label: "Calendar", to: uni.calendar, icon: CalendarRange, permission: UP.UNI_APPOINTMENT_VIEW },
        { key: "schedule", label: "Clinic Sessions", to: uni.schedule, icon: CalendarDays, permission: UP.UNI_APPOINTMENT_VIEW },
        { key: "procedure-requests", label: "Procedure Requests", to: uni.procedureRequests, icon: ClipboardList, permission: UP.PROCEDURE_REQUEST_VIEW },
        { key: "lab-requests", label: "Lab Requests", to: uni.labRequests, icon: FlaskConical, permission: UP.UNI_LAB_DECIDE },
      ],
    },
    {
      group: "Teaching",
      items: [
        { key: "review-queue", label: "Review Queue", to: uni.reviewQueue, icon: BadgeCheck, permission: UP.REVIEW_VIEW_ALL },
        { key: "students", label: "Students", to: uni.students, icon: GraduationCap, permission: UP.STUDENT_VIEW },
        { key: "requirements", label: "Requirements", to: uni.requirements, icon: Target, permission: UP.REQUIREMENT_VIEW },
      ],
    },
    {
      group: "Administration",
      items: [
        { key: "people", label: "People", to: uni.people, icon: Users, permission: UP.PEOPLE_VIEW },
        { key: "appointments", label: "Intake Appointments", to: uni.appointments, icon: CalendarDays, permission: UP.UNI_APPOINTMENT_MANAGE },
        { key: "registry", label: "Patient Registry", to: uni.registry, icon: ClipboardPlus, permission: UP.CASE_ASSIGN },
        { key: "activity", label: "Student Activity", to: uni.activity, icon: Activity, permission: UP.ACTIVITY_VIEW },
        announcements,
      ],
    },
  ],
  footer: [analytics, reports, support],
};

/* -------------------------------------------------------- clinic assistant */

/**
 * The front of the student clinic.
 *
 * "Patients" points at the registry, not at a case list — this desk holds
 * everyone ever registered, including the people nobody is treating yet, which
 * is precisely what separates it from a caseload. That was the old `only:`
 * override; here it is just what the line says.
 *
 * No Clinic Sessions and no Students. The published timetable and the cohort's
 * scorecards are faculty screens — the desk books chairs against it and
 * allocates people to it, which is what Appointments and the Calendar are for,
 * and neither job needs to read a student's grades. Both permissions were
 * taken off the role as well, so the URLs are refused and not merely hidden.
 */
const clinicDesk = {
  sections: [
    { group: null, items: [dashboard(roleDashboards.uni_assistant)] },
    {
      group: "Clinic",
      items: [
        { key: "desk-patients", label: "Patients", to: uni.registry, icon: UsersRound, permission: UP.CASE_ASSIGN },
        { key: "desk-appointments", label: "Appointments", to: uni.appointments, icon: CalendarDays, permission: UP.UNI_APPOINTMENT_MANAGE },
        { key: "calendar", label: "Calendar", to: uni.calendar, icon: CalendarRange, permission: UP.UNI_APPOINTMENT_MANAGE },
        { key: "patient-cards", label: "Patient Cards", to: uni.patientCards, icon: IdCard, permission: UP.CASE_VIEW_ALL },
        { key: "procedure-requests", label: "Procedure Requests", to: uni.procedureRequests, icon: ClipboardList, permission: UP.PROCEDURE_REQUEST_VIEW },
        { key: "lab-requests", label: "Lab Requests", to: uni.labRequests, icon: FlaskConical, permission: UP.UNI_LAB_DECIDE },
      ],
    },
    { group: "Administration", items: [announcements] },
  ],
  footer: [analytics, support],
};

/* -------------------------------------------------------------------- IT */

/**
 * Accounts and access, and nothing clinical whatsoever.
 *
 * The narrowest sidebar in the product and the one whose narrowness matters
 * most: this role can mint credentials for an entire cohort, so every entry it
 * does *not* have is a patient record a compromised IT session cannot reach.
 */
const it = {
  sections: [
    { group: null, items: [dashboard(roleDashboards.uni_it)] },
    {
      group: "Administration",
      items: [
        { key: "people", label: "People", to: uni.people, icon: Users, permission: UP.PEOPLE_VIEW },
        { key: "activity", label: "Student Activity", to: uni.activity, icon: Activity, permission: UP.ACTIVITY_VIEW },
        announcements,
      ],
    },
    {
      group: "Campus IT",
      items: [
        { key: "accounts", label: "All Accounts", to: uni.accounts, icon: Users, permission: UP.ACCOUNT_ADMIN },
        { key: "bulk-create", label: "Bulk Create", to: uni.bulkCreate, icon: UserPlus, permission: UP.BULK_CREATE },
      ],
    },
  ],
  footer: [analytics, support],
};

export const UNIVERSITY_NAV = {
  [ROLES.UNI_STUDENT]: student,
  [ROLES.UNI_SUPERVISOR]: supervisor,
  [ROLES.UNI_ADMIN]: dean,
  [ROLES.UNI_ASSISTANT]: clinicDesk,
  [ROLES.UNI_IT]: it,
};
