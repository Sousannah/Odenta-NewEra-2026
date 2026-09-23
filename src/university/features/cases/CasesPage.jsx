import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { CheckCircle2, Clock3, FolderOpen, IdCard, ShieldAlert, UserPlus } from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { UP } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { uni } from "@/config/paths";
import { CASE_STATUSES, DEPARTMENTS } from "@/config/academic";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/Misc";
import { PageHeader, Toolbar, StatCard, StatGrid } from "@/components/shared";
import {
  CaseAlerts,
  CaseStatusBadge,
  DepartmentChip,
} from "@/university/components";
import { AllocateCaseModal } from "./AllocateCaseModal";

/**
 * The case list.
 *
 * One screen for three audiences. A student sees only what is allocated to
 * them (the service scopes it); a supervisor sees their students' work; the
 * desk sees everything and can allocate. The difference is entirely in the
 * permissions, never in a role check inside the render.
 */
export default function CasesPage() {
  const { user, role, campus } = useOutletContext() ?? {};
  const { can } = useAuth();
  const navigate = useNavigate();

  const isStudent = role === ROLES.UNI_STUDENT;
  const isSupervisor = role === ROLES.UNI_SUPERVISOR;
  const canAllocate = can(UP.CASE_ASSIGN);

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [allocating, setAllocating] = useState(null);

  const scope = useMemo(() => {
    if (isStudent) return { studentId: user?.staffId ?? "all" };
    if (isSupervisor) return { supervisorId: user?.staffId ?? "all" };
    return {};
  }, [isStudent, isSupervisor, user?.staffId]);

  const { data: rows = [], loading, refetch } = useAsync(
    () => universityService.getCases({ ...scope, q: query, department, status }),
    [scope, query, department, status],
    []
  );

  const unassigned = rows.filter((item) => !item.studentId);
  const awaitingReview = rows.filter((item) => item.openSteps > 0);
  const consentGap = rows.filter((item) => item.studentId && !item.consentSigned);

  const columns = [
    {
      key: "patientName",
      header: "Patient",
      sortable: true,
      render: (item) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(uni.case(item.id))}
            className="od-focus block truncate rounded text-[13.5px] font-bold text-ink hover:text-brand-700"
          >
            {item.patientName}
          </button>
          <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
            {item.age} yrs · {item.nationalId}
          </span>
          <CaseAlerts item={item} compact className="mt-1.5" />
        </div>
      ),
    },
    {
      key: "chiefComplaint",
      header: "Chief complaint",
      render: (item) => (
        <span className="line-clamp-2 max-w-[260px] text-[13px] text-ink-muted">
          {item.chiefComplaint}
        </span>
      ),
    },
    {
      key: "department",
      header: "Rotation",
      sortable: true,
      render: (item) => <DepartmentChip department={item.department} short />,
    },
    ...(isStudent
      ? []
      : [
          {
            key: "studentName",
            header: "Student",
            sortable: true,
            render: (item) =>
              item.studentName ? (
                <span className="text-[13px] font-semibold text-ink">{item.studentName}</span>
              ) : (
                <span className="text-[12.5px] font-semibold text-danger">Unallocated</span>
              ),
          },
        ]),
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col items-start gap-1.5">
          <CaseStatusBadge status={item.status} />
          {item.openSteps ? (
            <span className="text-[11px] font-bold text-warning-ink">
              {item.openSteps} step(s) awaiting review
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "nextVisitAt",
      header: "Next visit",
      sortable: true,
      render: (item) =>
        item.nextVisitAt ? (
          <span className="text-[13px] font-semibold text-ink">
            {formatDate(item.nextVisitAt, "d MMM yyyy")}
          </span>
        ) : (
          <span className="text-[13px] text-ink-faint">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          {canAllocate && !item.studentId ? (
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
              onClick={() => setAllocating(item)}
            >
              Allocate
            </Button>
          ) : null}
          <Button size="xs" onClick={() => navigate(uni.case(item.id))}>
            Open
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title={isStudent ? "My cases" : "Cases"}
        description={
          isStudent
            ? "Every patient allocated to you this term, with the steps still waiting on a staff member."
            : `The teaching clinic's caseload${campus?.shortName ? ` at ${campus.shortName}` : ""}.`
        }
        actions={
          <Button
            variant="secondary"
            leftIcon={<IdCard className="h-4 w-4" />}
            onClick={() => navigate(uni.patientCards)}
          >
            Patient cards
          </Button>
        }
      />

      <StatGrid cols={4}>
        <StatCard
          label="Cases" value={rows.length}
          icon={<FolderOpen className="h-5 w-5" />}
        />
        <StatCard
          label="Awaiting review" value={awaitingReview.length} tone="warning"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          label="Consent outstanding"
          value={consentGap.length}
          tone="danger"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        {isStudent ? (
          <StatCard
            label="Completed" value={rows.filter((item) => item.status === "completed").length} tone="success"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        ) : (
          <StatCard
            label="Unallocated" value={unassigned.length} tone="success"
            icon={<UserPlus className="h-5 w-5" />}
          />
        )}
      </StatGrid>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Patient, national ID, card number…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <>
            <MiniSelect value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="all">All rotations</option>
              {DEPARTMENTS.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </MiniSelect>
            <MiniSelect value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Any status</option>
              {CASE_STATUSES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </MiniSelect>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyTitle={isStudent ? "No cases allocated to you yet" : "No cases match those filters"}
        emptyDescription={
          isStudent
            ? "The clinic desk allocates screened patients to students at the start of each session."
            : "Try clearing the search or widening the rotation filter."
        }
      />

      <AllocateCaseModal
        item={allocating}
        open={Boolean(allocating)}
        onClose={() => setAllocating(null)}
        onAllocated={refetch}
      />
    </div>
  );
}
