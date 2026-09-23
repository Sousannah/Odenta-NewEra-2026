import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AlarmClock, Check, Clock3, FlaskConical, Hammer, Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { ROLES } from "@/auth/roles";
import { UP } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { LAB_KINDS, LAB_REQUEST_STATUSES } from "@/config/academic";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, MiniSelect, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Toolbar, StatCard, StatGrid } from "@/components/shared";
import { DepartmentChip, LabStatusBadge } from "@/university/components";
import { RaiseLabRequestModal } from "./RaiseLabRequestModal";

const NEXT_STAGE = {
  pending: "approved",
  approved: "in_production",
  in_production: "ready",
  ready: "delivered",
};

/**
 * Lab requests.
 *
 * A student raises one, a supervisor approves it, the lab moves it through
 * production. Overdue is computed against `dueAt` rather than stored, so a
 * date change fixes the flag immediately.
 */
export default function LabRequestsPage() {
  const { user, role } = useOutletContext() ?? {};
  const { can } = useAuth();
  const toast = useToast();

  const isStudent = role === ROLES.UNI_STUDENT;
  const isSupervisor = role === ROLES.UNI_SUPERVISOR;
  const canDecide = can(UP.UNI_LAB_DECIDE);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [labKind, setLabKind] = useState("all");
  const [raising, setRaising] = useState(false);
  /* The decision the supervisor is about to record, held until they have had
     a chance to say why — a bare rejection is not something a student can
     act on, and this is the only place the reason can be written. */
  const [deciding, setDeciding] = useState(null);
  const [responseNote, setResponseNote] = useState("");
  const [busy, setBusy] = useState(false);

  const scope = isStudent
    ? { studentId: user?.staffId ?? "all" }
    : isSupervisor
      ? { supervisorId: user?.staffId ?? "all" }
      : {};

  const { data: rows = [], loading, refetch } = useAsync(
    () => universityService.getLabRequests({ ...scope, q: query, status, labKind }),
    [scope.studentId, scope.supervisorId, query, status, labKind],
    []
  );

  const openDecision = (item, status) => {
    setDeciding({ item, status });
    setResponseNote("");
  };

  const submitDecision = async () => {
    if (!deciding) return;
    setBusy(true);
    try {
      await universityService.decideLabRequest(deciding.item.id, {
        status: deciding.status,
        note: responseNote.trim() || null,
      });
      toast.success(
        deciding.status === "rejected"
          ? "Request rejected"
          : `Moved to ${deciding.status.replace(/_/g, " ")}`,
        deciding.item.item
      );
      setDeciding(null);
      refetch();
      refetchCounts();
    } finally {
      setBusy(false);
    }
  };

  /* Counted over everything the viewer can see, not over the filtered rows —
     a chip that reads "Pending (0)" because Pending is selected is useless. */
  const { data: unfiltered = [], refetch: refetchCounts } = useAsync(
    () => universityService.getLabRequests({ ...scope }),
    [scope.studentId, scope.supervisorId],
    []
  );

  const counts = useMemo(() => {
    const map = { all: unfiltered.length };
    LAB_REQUEST_STATUSES.forEach((entry) => {
      map[entry.value] = unfiltered.filter((item) => item.status === entry.value).length;
    });
    return map;
  }, [unfiltered]);

  const today = toDateKey();
  const overdue = rows.filter(
    (item) => item.dueAt < today && !["delivered", "rejected"].includes(item.status)
  );

  const columns = [
    {
      key: "item",
      header: "Work",
      sortable: true,
      render: (item) => (
        <div className="min-w-0">
          <span className="block truncate text-[13.5px] font-bold text-ink">{item.item}</span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
            {item.patientName} · teeth {item.teeth.join(", ")} · shade {item.shade}
          </span>
        </div>
      ),
    },
    ...(isStudent
      ? []
      : [
          {
            key: "studentName",
            header: "Student",
            sortable: true,
            render: (item) => (
              <span className="text-[13px] font-semibold text-ink">{item.studentName}</span>
            ),
          },
        ]),
    {
      key: "department",
      header: "Rotation",
      sortable: true,
      render: (item) => <DepartmentChip department={item.department} short />,
    },
    {
      key: "labName",
      header: "Lab",
      sortable: true,
      render: (item) => (
        <div className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-ink">{item.labName}</span>
          <Badge tone={item.labKind === "external" ? "warning" : "brand"} className="mt-1">
            {item.labKind === "external" ? "External" : "University"}
          </Badge>
        </div>
      ),
    },
    {
      key: "dueAt",
      header: "Due",
      sortable: true,
      render: (item) => {
        const late = item.dueAt < today && !["delivered", "rejected"].includes(item.status);
        return (
          <span
            className={
              late ? "text-[13px] font-bold text-danger" : "text-[13px] font-semibold text-ink-muted"
            }
          >
            {formatDate(item.dueAt, "d MMM yyyy")}
            {late ? " · overdue" : ""}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Stage",
      sortable: true,
      render: (item) => <LabStatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (item) =>
        canDecide && NEXT_STAGE[item.status] ? (
          <div className="flex items-center justify-end gap-2">
            {item.status === "pending" ? (
              <Button
                variant="secondary"
                size="xs"
                leftIcon={<X className="h-3.5 w-3.5" />}
                onClick={() => openDecision(item, "rejected")}
              >
                Reject
              </Button>
            ) : null}
            <Button
              size="xs"
              leftIcon={item.status === "pending" ? <Check className="h-3.5 w-3.5" /> : undefined}
              onClick={() => openDecision(item, NEXT_STAGE[item.status])}
            >
              {item.status === "pending" ? "Approve" : "Advance"}
            </Button>
          </div>
        ) : (
          <span className="text-[12px] text-ink-faint">{item.note ?? "—"}</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Lab requests"
        description={
          isStudent
            ? "Prosthetic work you have sent to the lab, and where each case is."
            : "Every case in the lab pipeline, university and external."
        }
        actions={
          can(UP.UNI_LAB_REQUEST) ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setRaising(true)}>
              Raise a request
            </Button>
          ) : null
        }
      />

      <StatGrid cols={4}>
        <StatCard label="Requests" value={rows.length} icon={<FlaskConical className="h-5 w-5" />} />
        <StatCard
          label="Awaiting approval" value={rows.filter((item) => item.status === "pending").length} tone="warning"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          label="In production" value={rows.filter((item) => item.status === "in_production").length}
          icon={<Hammer className="h-5 w-5" />}
        />
        <StatCard
          label="Overdue" value={overdue.length} tone="danger"
          icon={<AlarmClock className="h-5 w-5" />}
        />
      </StatGrid>

      <div className="flex flex-wrap gap-2">
        {[{ value: "all", label: "All" }, ...LAB_REQUEST_STATUSES].map((entry) => {
          const active = status === entry.value;
          return (
            <button
              key={entry.value}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(entry.value)}
              className={cn(
                "od-focus rounded-xl px-3.5 py-2 text-[13px] font-semibold transition",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 text-ink-muted hover:bg-brand-100 hover:text-brand-700"
              )}
            >
              {entry.label} ({counts[entry.value] ?? 0})
            </button>
          );
        })}
      </div>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Work, patient, lab…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <>
            <MiniSelect value={labKind} onChange={(event) => setLabKind(event.target.value)}>
              <option value="all">Any lab</option>
              {LAB_KINDS.map((entry) => (
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
        emptyTitle="No lab requests"
        emptyDescription="Nothing matches those filters."
      />

      <Modal
        open={Boolean(deciding)}
        onClose={() => setDeciding(null)}
        title={deciding?.status === "rejected" ? "Reject lab request" : "Approve lab request"}
        description={deciding ? `${deciding.item.item} · ${deciding.item.patientName}` : undefined}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button
              loading={busy}
              variant={deciding?.status === "rejected" ? "danger" : "primary"}
              onClick={submitDecision}
            >
              {deciding?.status === "rejected" ? "Reject" : "Confirm"}
            </Button>
          </>
        }
      >
        <Field
          label="Response to the student"
          hint={
            deciding?.status === "rejected"
              ? "Say what was wrong with the work — this is what the student reads."
              : "Optional. Anything the lab or the student should know."
          }
        >
          <Textarea
            rows={4}
            value={responseNote}
            onChange={(event) => setResponseNote(event.target.value)}
            placeholder={
              deciding?.status === "rejected"
                ? "Impression distorted at the distal margin — retake."
                : "Shade confirmed with the patient in daylight."
            }
          />
        </Field>
      </Modal>

      <RaiseLabRequestModal
        open={raising}
        onClose={() => setRaising(false)}
        onCreated={refetch}
        studentId={user?.staffId}
      />
    </div>
  );
}
