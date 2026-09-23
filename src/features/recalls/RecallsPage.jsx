import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlarmClock,
  BellRing,
  CalendarCheck2,
  CalendarPlus,
  MessageSquare,
  PhoneCall,
} from "lucide-react";
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
import { PageHeader, StatCard, StatGrid, PatientAlerts, toneFor } from "@/components/shared";
import { app } from "@/config/paths";

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

  const { data: recalls = [], loading, refetch } = useAsync(
    () => patientService.getRecalls({ status }),
    [status],
    [],
    /* The status is in the key because it is in the query — see the note on
       `useAsync`. Coming back to this tab paints the rows immediately and
       refreshes them underneath. */
    { key: `clinic:recalls:${status}` }
  );

  /**
   * Rows actioned since the last fetch.
   *
   * Only governs what the button looks like while the list catches up — the
   * write is real either way. Without it, a receptionist working down the list
   * has no way to see which rows they have already rung.
   */
  const [logged, setLogged] = useState(() => new Set());

  /**
   * Log that the patient was rung.
   *
   * This used to be `toast.success("Call logged")` and nothing else: the button
   * looked like it worked and persisted nothing, so a second receptionist rang
   * the same person an hour later and the practice could not tell somebody who
   * had declined from somebody nobody had reached.
   *
   * Note what the server deliberately does *not* do with this: it does not move
   * the recall out of due/overdue. Being rung is not being seen, and a patient
   * who drops off the actionable list because somebody phoned once is a patient
   * nobody ever calls again. The attempt count is what changes.
   */
  const logCall = async (row, outcome = "called") => {
    try {
      await patientService.logRecallContact(row.id, { outcome });
      setLogged((previous) => new Set(previous).add(row.id));
      toast.success(
        outcome === "declined" ? "Marked as declined" : "Call logged",
        row.patient?.name
      );
      /* Declining removes the row from the actionable tabs, so the list has to
         be re-read; an ordinary call leaves it in place. */
      if (outcome === "declined") refetch();
    } catch (error) {
      toast.error("Could not log the call", error.message);
    }
  };

  /**
   * Tab counts, from the server.
   *
   * These used to be `recalls.reduce(...)` over the fetched array, which was
   * wrong in two directions at once. The list is filtered by the selected tab,
   * so counting it gave every *other* tab a zero — and it is continuation-paged,
   * so even the selected tab described the first fifty rows while claiming to
   * describe the queue.
   *
   * `/recalls/counts` is one `GROUP BY` inside a single partition: a few RU,
   * and it does not change with the filter, so switching tabs does not re-run
   * it.
   */
  const { data: counts = {} } = useAsync(() => patientService.getRecallCounts(), [], {}, {
    key: "clinic:recalls:counts",
  });

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
            navigate(app.patient(row.patientId));
          }}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <Avatar name={row.patient?.name ?? ""} size="sm" />
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-[13.5px] font-bold text-ink hover:text-brand-600">
                {row.patient?.name}
              </span>
              {/**
               * Nothing to draw here, and that is deliberate.
               *
               * A recall row carries `{ id, name, phone }` — see the server's
               * `projectRecall`. The medical history is not on it for anybody,
               * so the `in` check means this renders nothing rather than
               * passing an object of undefineds to PatientAlerts, which would
               * read that as "history not checked" and stamp an amber warning
               * on every row of a call list.
               *
               * Kept as a guarded render rather than deleted, because a future
               * caller that legitimately holds the record open — a clinician
               * working the list — can pass the flags and have them appear,
               * without this file changing.
               */}
              {row.patient && "alerts" in row.patient ? (
                <PatientAlerts patient={row.patient} compact />
              ) : null}
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
              disabled={logged.has(row.id)}
              onClick={(event) => {
                event.stopPropagation();
                logCall(row);
              }}
            >
              {logged.has(row.id) ? "Logged" : "Call"}
            </Button>
            {/**
             * Nobody answered.
             *
             * Its own outcome rather than a second press of Call, because the
             * two mean different things to whoever picks the list up next: three
             * unanswered attempts is a patient to try at a different time of
             * day, and three conversations is a patient who is not coming.
             *
             * This replaces an "SMS" button that claimed "Reminder sent" and
             * sent nothing — there is no messaging provider wired to this
             * product, and a button that lies about having contacted a patient
             * is worse than no button.
             */}
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
              disabled={logged.has(row.id)}
              onClick={(event) => {
                event.stopPropagation();
                logCall(row, "no_answer");
              }}
            >
              No answer
            </Button>
            <Button
              size="xs"
              leftIcon={<CalendarPlus className="h-3.5 w-3.5" />}
              onClick={(event) => {
                event.stopPropagation();
                navigate(`${app.schedule}?new=1`);
              }}
            >
              Book
            </Button>
          </span>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Recalls"
        description="Preventive follow-up driven by each patient's risk-based interval."
      />

      <StatGrid cols={3}>
        <StatCard
          label="Overdue" value={counts.overdue ?? 0} tone="danger"
          icon={<AlarmClock className="h-5 w-5" />}
        />
        <StatCard
          label="Due now" value={counts.due ?? 0} tone="warning"
          icon={<BellRing className="h-5 w-5" />}
        />
        <StatCard
          label="Scheduled" value={counts.scheduled ?? 0} tone="success"
          icon={<CalendarCheck2 className="h-5 w-5" />}
        />
      </StatGrid>

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
            onRowClick={(row) => navigate(app.patient(row.patientId))}
            emptyTitle="No recalls in this bucket"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
