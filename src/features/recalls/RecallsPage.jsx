import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, MessageSquare, PhoneCall } from "lucide-react";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { patientService } from "@/services";
import { formatDate, fromNow } from "@/lib/format";
import { RECALL_INTERVALS } from "@/config/dentalStandards";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PageHeader, StatCard, PatientAlerts, toneFor } from "@/components/shared";

/**
 * Recalls.
 *
 * Preventive dentistry only works if patients come back. This is the list of
 * who is due, how overdue they are, and what interval their risk implies.
 */
export default function RecallsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const [status, setStatus] = useState("all");

  const { data: recalls = [], loading } = useAsync(
    () => patientService.getRecalls({ status }),
    [status],
    []
  );

  const counts = recalls.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  const columns = [
    {
      key: "patient",
      header: "Patient",
      sortable: true,
      sortValue: (row) => row.patient?.name ?? "",
      render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/patients/${row.patientId}`);
          }}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <Avatar name={row.patient?.name ?? ""} size="sm" />
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-[13.5px] font-bold text-ink hover:text-brand-600">
                {row.patient?.name}
              </span>
              <PatientAlerts patient={row.patient} compact />
            </span>
            <span className="block truncate text-[12px] text-ink-soft">{row.patient?.phone}</span>
          </span>
        </button>
      ),
    },
    { key: "reason", header: "Reason" },
    {
      key: "interval",
      header: "Interval",
      render: (row) =>
        RECALL_INTERVALS.find((item) => item.value === row.interval)?.label ??
        `${row.interval} months`,
    },
    {
      key: "dueDate",
      header: "Due",
      sortable: true,
      render: (row) => (
        <span className="block">
          <span className="block text-[13px] font-semibold text-ink">
            {formatDate(row.dueDate, "d MMM yyyy")}
          </span>
          <span className="block text-[11.5px] text-ink-soft">{fromNow(row.dueDate)}</span>
        </span>
      ),
    },
    {
      key: "lastContact",
      header: "Last contact",
      render: (row) => (row.lastContact ? formatDate(row.lastContact, "d MMM yyyy") : "Never"),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <Badge tone={toneFor(row.status)}>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) =>
        can(P.RECALL_MANAGE) ? (
          <span className="flex justify-end gap-1.5">
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<PhoneCall className="h-3.5 w-3.5" />}
              onClick={(event) => {
                event.stopPropagation();
                toast.success("Call logged", row.patient?.name);
              }}
            >
              Call
            </Button>
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
              onClick={(event) => {
                event.stopPropagation();
                toast.success("Reminder sent", row.patient?.name);
              }}
            >
              SMS
            </Button>
            <Button
              size="xs"
              leftIcon={<CalendarPlus className="h-3.5 w-3.5" />}
              onClick={(event) => {
                event.stopPropagation();
                navigate("/schedule?new=1");
              }}
            >
              Book
            </Button>
          </span>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="Recalls"
        description="Preventive follow-up driven by each patient's risk-based interval."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Overdue" value={counts.overdue ?? 0} tone="danger" />
        <StatCard label="Due now" value={counts.due ?? 0} tone="warning" />
        <StatCard label="Scheduled" value={counts.scheduled ?? 0} tone="success" />
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="overdue" badge={counts.overdue ?? 0}>
            Overdue
          </TabsTrigger>
          <TabsTrigger value="due" badge={counts.due ?? 0}>
            Due
          </TabsTrigger>
          <TabsTrigger value="scheduled" badge={counts.scheduled ?? 0}>
            Scheduled
          </TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="pt-5">
          <DataTable
            columns={columns}
            rows={recalls}
            loading={loading}
            onRowClick={(row) => navigate(`/patients/${row.patientId}`)}
            emptyTitle="No recalls in this bucket"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
