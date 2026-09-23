import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  X,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { fromNow } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { UP } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { PROCEDURE_REQUEST_STATUSES } from "@/config/academic";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, MiniSelect, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Toolbar, StatCard, StatGrid } from "@/components/shared";
import { DepartmentChip, RequestStatusBadge } from "@/university/components";
import { RaiseProcedureRequestModal } from "./RaiseProcedureRequestModal";

/**
 * Procedure requests.
 *
 * What a student needs from the desk mid-session — a radiograph, more chair
 * time, a supervisor called over. Small things, but a session stalls without
 * them, so `urgent` sorts to the top and stays visible.
 */
export default function ProcedureRequestsPage() {
  const { user, role } = useOutletContext() ?? {};
  const { can } = useAuth();
  const toast = useToast();

  const isStudent = role === ROLES.UNI_STUDENT;
  const canDecide = can(UP.PROCEDURE_REQUEST_DECIDE);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [raising, setRaising] = useState(false);
  /* Held until the desk has said why. A canned "Declined at the desk" tells
     the student nothing, and they cannot reply to it — this is the only
     place the actual reason can be written. */
  const [deciding, setDeciding] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: rows = [], loading, refetch } = useAsync(
    () =>
      universityService.getProcedureRequests({
        ...(isStudent ? { studentId: user?.staffId ?? "all" } : {}),
        q: query,
        status,
      }),
    [isStudent, user?.staffId, query, status],
    []
  );

  const openDecision = (item, next) => {
    setDeciding({ item, status: next });
    setNote("");
  };

  const submitDecision = async () => {
    if (!deciding) return;
    setBusy(true);
    try {
      await universityService.decideProcedureRequest(deciding.item.id, {
        status: deciding.status,
        decidedBy: user?.name ?? null,
        note: note.trim() || null,
      });
      toast.success(
        deciding.status === "approved" ? "Request approved" : "Request declined",
        deciding.item.kind
      );
      setDeciding(null);
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: "kind",
      header: "Request",
      sortable: true,
      render: (item) => (
        <div className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13.5px] font-bold text-ink">{item.kind}</span>
            {item.urgency === "urgent" ? <Badge tone="danger">Urgent</Badge> : null}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
            {item.patientName} · {item.caseId}
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
      key: "requestedAt",
      header: "Raised",
      sortable: true,
      render: (item) => <span className="text-[13px] text-ink-muted">{fromNow(item.requestedAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col items-start gap-1">
          <RequestStatusBadge status={item.status} />
          {item.decidedBy ? (
            <span className="text-[11.5px] text-ink-faint">by {item.decidedBy}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (item) =>
        canDecide && item.status === "pending" ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<X className="h-3.5 w-3.5" />}
              onClick={() => openDecision(item, "declined")}
            >
              Decline
            </Button>
            <Button
              size="xs"
              leftIcon={<Check className="h-3.5 w-3.5" />}
              onClick={() => openDecision(item, "approved")}
            >
              Approve
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
        title="Procedure requests"
        description={
          isStudent
            ? "What you have asked the clinic desk for, and what they decided."
            : "Chairside requests from students waiting on the desk."
        }
        actions={
          can(UP.CASE_VIEW_OWN) ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setRaising(true)}>
              Raise a request
            </Button>
          ) : null
        }
      />

      <StatGrid cols={4}>
        <StatCard
          label="Requests" value={rows.length}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Pending" value={rows.filter((item) => item.status === "pending").length} tone="warning"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          label="Urgent" value={rows.filter((item) => item.urgency === "urgent" && item.status === "pending").length} tone="danger"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Approved" value={rows.filter((item) => item.status === "approved").length} tone="success"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </StatGrid>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Request, student or patient…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <MiniSelect value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Any status</option>
            {PROCEDURE_REQUEST_STATUSES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </MiniSelect>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyTitle="No requests"
        emptyDescription={
          isStudent ? "Raise one when you need something from the desk." : "The desk is clear."
        }
      />

      <Modal
        open={Boolean(deciding)}
        onClose={() => setDeciding(null)}
        title={deciding?.status === "approved" ? "Approve request" : "Decline request"}
        description={deciding ? `${deciding.item.kind} · ${deciding.item.studentName}` : undefined}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button
              loading={busy}
              variant={deciding?.status === "declined" ? "danger" : "primary"}
              onClick={submitDecision}
            >
              {deciding?.status === "approved" ? "Approve" : "Decline"}
            </Button>
          </>
        }
      >
        <Field
          label="Response to the student"
          hint={
            deciding?.status === "declined"
              ? "Say why, and what they should do instead — the student reads this mid-session."
              : "Optional. Where to collect it, when it will be ready."
          }
        >
          <Textarea
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              deciding?.status === "declined"
                ? "Chair already booked for the afternoon session — try the 15:00 slot."
                : "Radiographer will come to chair F1-08 in ten minutes."
            }
          />
        </Field>
      </Modal>

      <RaiseProcedureRequestModal
        open={raising}
        onClose={() => setRaising(false)}
        onCreated={refetch}
        studentId={user?.staffId}
      />
    </div>
  );
}
