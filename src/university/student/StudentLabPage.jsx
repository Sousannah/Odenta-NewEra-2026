import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Building2, FlaskConical, GraduationCap, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { uni } from "@/config/paths";
import { LAB_REQUEST_STATUSES } from "@/config/academic";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { KeyValue } from "@/components/ui/Misc";
import { PageHeader } from "@/components/shared";
import { DepartmentChip, LabStatusBadge } from "@/university/components";

/**
 * Everything the student has sent to a lab.
 *
 * Raised from inside a patient record — this screen is the tracking view, so
 * it is a list of states rather than a form. The filter row doubles as the
 * count: "3 pending" is the thing a student is actually chasing.
 */

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "in_production", label: "In production" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
  { key: "rejected", label: "Rejected" },
];

const statusLabel = (status) =>
  LAB_REQUEST_STATUSES.find((item) => item.value === status)?.label ?? status;

export default function StudentLabPage() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const { data: requests = [], loading } = useAsync(
    () => universityService.getLabRequests({ studentId: user?.staffId ?? "all" }),
    [user?.staffId],
    []
  );

  const counts = useMemo(() => {
    const map = { all: requests.length };
    FILTERS.slice(1).forEach((entry) => {
      map[entry.key] = requests.filter((item) => item.status === entry.key).length;
    });
    return map;
  }, [requests]);

  const visible = useMemo(
    () => (filter === "all" ? requests : requests.filter((item) => item.status === filter)),
    [requests, filter]
  );

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Lab requests"
        description="Everything you have sent to the university or an external lab, and where it is."
        actions={
          <Button variant="secondary" onClick={() => navigate(uni.myPatients)}>
            Raise from a patient
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((entry) => {
          const selected = filter === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => setFilter(entry.key)}
              aria-pressed={selected}
              className={cn(
                "od-focus rounded-xl px-3.5 py-2 text-[13px] font-semibold transition",
                selected
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 text-ink-muted hover:bg-brand-100 hover:text-brand-700"
              )}
            >
              {entry.label} ({counts[entry.key] ?? 0})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<FlaskConical className="h-6 w-6" />}
          title={filter === "all" ? "No lab requests yet" : `No ${statusLabel(filter).toLowerCase()} requests`}
          description="Lab requests appear here once you raise them from a patient's Lab tab."
          className="od-card py-16"
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((request) => (
            <Card as="li" key={request.id}>
              <CardBody className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                        request.labKind === "external"
                          ? "bg-accent-50 text-accent-700"
                          : "bg-brand-100 text-brand-700"
                      )}
                    >
                      {request.labKind === "external" ? (
                        <Building2 className="h-5 w-5" />
                      ) : (
                        <GraduationCap className="h-5 w-5" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-bold text-ink">
                        {request.item}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {request.labName} · request {request.id}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <DepartmentChip department={request.department} short />
                    <LabStatusBadge status={request.status} />
                  </span>
                </div>

                <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <KeyValue
                    label="Patient"
                    value={
                      <span className="flex min-w-0 items-center gap-1.5">
                        <User className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
                        {request.patientName}
                      </span>
                    }
                  />
                  <KeyValue label="Submitted" value={formatDate(request.requestedAt, "d MMM yyyy")} />
                  <KeyValue label="Due" value={formatDate(request.dueAt, "d MMM yyyy")} />
                  <KeyValue
                    label="Teeth / shade"
                    value={`${(request.teeth ?? []).join(", ") || "—"} · ${request.shade ?? "—"}`}
                  />
                </div>

                {request.note ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-ink-muted">
                    <span className="font-bold text-ink">Lab response: </span>
                    {request.note}
                    {request.decidedAt ? (
                      <span className="mt-1 block text-[11.5px] text-ink-faint">
                        Responded {formatDate(request.decidedAt, "d MMM yyyy")}
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
