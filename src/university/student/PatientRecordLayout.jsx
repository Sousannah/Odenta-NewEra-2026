import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileSignature,
  FileText,
  FlaskConical,
  History,
  Images,
  Scan,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { uni } from "@/config/paths";
import { formatDate } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CaseAlerts, CaseStatusBadge, DepartmentChip } from "@/university/components";

/**
 * The patient record shell.
 *
 * Every tab below works one patient, so the identity strip is hoisted out of
 * them: a student mid-procedure should never have to check which chart they
 * are typing into. The record is fetched once here and handed down through the
 * outlet rather than re-fetched per tab.
 */

const TABS = [
  { key: "sheets", label: "Examination Sheet", icon: FileText },
  { key: "medical", label: "Medical", icon: Stethoscope },
  { key: "history", label: "History", icon: History },
  { key: "chart", label: "Tooth Chart", icon: ClipboardList },
  { key: "gallery", label: "Gallery", icon: Images },
  { key: "xrays", label: "X-Rays", icon: Scan },
  { key: "appointments", label: "Appointments", icon: CalendarDays },
  { key: "consent", label: "Consent", icon: FileSignature },
  { key: "review-steps", label: "Review Steps", icon: ClipboardCheck },
  { key: "lab", label: "Lab", icon: FlaskConical },
  { key: "reviews", label: "Reviews", icon: ClipboardCheck },
];

function TabLink({ nationalId, tab }) {
  const Icon = tab.icon;
  return (
    <NavLink
      to={uni.patientTab(nationalId, tab.key)}
      className={({ isActive }) =>
        cn(
          "od-focus flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-center transition-colors",
          isActive
            ? "bg-brand-50 text-brand-700"
            : "text-ink-muted hover:bg-slate-100 hover:text-ink"
        )
      }
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
      <span className="text-[11px] font-bold leading-tight">{tab.label}</span>
    </NavLink>
  );
}

export default function PatientRecordLayout() {
  const { nationalId } = useParams();
  const navigate = useNavigate();

  const { data: record, loading, error, refetch, setData } = useAsync(
    () => universityService.getPatientRecord(nationalId),
    [nationalId]
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-6">
        <EmptyState
          title={error?.isForbidden ? "Not your patient" : "Patient not found"}
          description={
            error?.isForbidden
              ? "This record belongs to another student's caseload. Ask the clinic desk if it should be allocated to you."
              : `No record matches ${nationalId}. Check the number on the patient's card.`
          }
          action={
            <Button variant="secondary" onClick={() => navigate(uni.myPatients)}>
              Back to my patients
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* ---------------------------------------------------- identity strip */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur print:static print:backdrop-blur-none">
        <div className="flex flex-wrap items-center gap-4 px-6 pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="od-print-hide"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(uni.myPatients)}
          >
            Patients
          </Button>

          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={record.patientName} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-extrabold text-ink">{record.patientName}</h2>
                <CaseStatusBadge status={record.status} />
                <DepartmentChip department={record.department} short />
              </div>
              <p className="mt-0.5 truncate text-[12px] text-ink-soft">
                {record.age} yrs · {record.gender} · {record.nationalId}
                {record.cardNumber ? ` · card ${record.cardNumber}` : ""} · last seen{" "}
                {formatDate(record.lastVisitAt, "d MMM yyyy")}
              </p>
            </div>
          </div>

          <div className="ml-auto text-right">
            <span className="od-label">Staff member</span>
            <p className="text-[13px] font-bold text-ink">{record.supervisorName ?? "—"}</p>
          </div>
        </div>

        <CaseAlerts item={record} className="px-6 pt-3" />

        <nav className="od-scroll-x od-print-hide flex items-stretch gap-1 overflow-x-auto px-4 py-2">
          {TABS.map((tab) => (
            <TabLink key={tab.key} nationalId={nationalId} tab={tab} />
          ))}
        </nav>
      </header>

      <div className="min-h-0 flex-1">
        <Outlet context={{ record, nationalId, refetchRecord: refetch, setRecord: setData }} />
      </div>
    </div>
  );
}
