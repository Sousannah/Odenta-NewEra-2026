import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  CalendarCheck,
  ClipboardList,
  FlaskConical,
  Globe,
  IdCard,
  LogIn,
  TrendingUp,
  UserPlus,
  UserRoundPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatNumber } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { ROLES } from "@/auth/roles";
import { uni } from "@/config/paths";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { LineAreaChart } from "@/components/charts";
import { DashboardShell, toneFor, labelFor } from "@/components/shared";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { AssignStudentModal } from "./AssignStudentModal";

/**
 * Clinic desk.
 *
 * The front of the student clinic, and deliberately short. The board used to
 * carry six cards — the waiting room, an allocation list, pending procedure
 * requests, the lab queue, and an audit trail of decisions already taken — so
 * the thing the desk actually looks at fifty times a day, today's list, was
 * one panel among five screens' worth of summaries. Each of those lists has a
 * screen of its own that does the job better; what belongs here is the shape
 * of the day and a way into them.
 *
 * So: four counters, a growth curve, six doors, and today.
 *
 * Every read is bounded and there are only two of them. The counters and the
 * registration series come from `getDeskSummary` — on a campus with fifty
 * thousand patients, counting "patients on file" in the browser means a table
 * scan every time somebody opens their dashboard. The visit list is one day,
 * which is bounded by the clinic's own capacity.
 */

/** Only the rows the card shows. Asking for more is paying for more. */
const VISIT_ROWS = 8;

/** The six places the desk goes. Counts come off the summary, not new reads. */
const doorsFor = (summary) => [
  {
    label: "Register a patient",
    icon: UserRoundPlus,
    to: uni.registry,
    tone: "bg-brand-100 text-brand-700",
  },
  {
    label: "Book a visit",
    icon: CalendarCheck,
    to: uni.appointments,
    tone: "bg-success-soft text-success-strong",
  },
  {
    label: "Allocate cases",
    icon: UserPlus,
    to: uni.cases,
    tone: "bg-warning-soft text-warning-ink",
    count: summary?.cases.unassigned,
  },
  {
    label: "Procedure requests",
    icon: ClipboardList,
    to: uni.procedureRequests,
    tone: "bg-info-soft text-info-ink",
    count: summary?.requests.procedurePending,
  },
  {
    label: "Lab board",
    icon: FlaskConical,
    to: uni.labRequests,
    tone: "bg-accent-50 text-accent-700",
    count: summary?.requests.labPending,
  },
  {
    label: "Patient cards",
    icon: IdCard,
    to: uni.patientCards,
    tone: "bg-slate-100 text-ink-muted",
  },
];

export default function ClinicDeskDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();
  const today = toDateKey();

  const [opened, setOpened] = useState(null);
  const [assigning, setAssigning] = useState(null);

  const { data: summary, loading: summaryLoading, refetch: refetchSummary } = useAsync(
    () => universityService.getDeskSummary({ date: today }),
    [today],
    null
  );

  const { data: visits = [], loading, refetch: refetchVisits } = useAsync(
    () => universityService.getAppointments({ date: today }),
    [today],
    []
  );

  const reload = () => {
    refetchVisits();
    refetchSummary();
  };

  const waiting = useMemo(
    () => visits.filter((item) => ["registered", "arrived"].includes(item.status)),
    [visits]
  );
  const inChair = useMemo(() => visits.filter((item) => item.status === "encounter"), [visits]);

  /* `2026-04` → `Apr`. The series always carries the full window, including
     the months with nothing in them, so the axis does not move. */
  const growth = useMemo(
    () =>
      (summary?.registrations ?? []).map((point) => ({
        month: format(parseISO(`${point.month}-01`), "MMM"),
        value: point.value,
      })),
    [summary]
  );

  const registeredThisMonth = growth.length ? growth[growth.length - 1].value : 0;

  /* The tiles read the server's counters and fall back to what is on screen
     only while the summary is still in flight, so a slow counter never shows
     a zero that looks like an empty clinic. */
  const counts = {
    onFile: summary?.cases.total ?? 0,
    booked: summary?.visits.total ?? visits.length,
    waiting: summary?.visits.waiting ?? waiting.length,
    unassigned: summary?.cases.unassigned ?? 0,
  };

  const checkIn = async (visit) => {
    await universityService.updateAppointment(visit.id, { status: "arrived" });
    toast.success("Checked in", visit.patientName);
    reload();
  };

  if (loading && summaryLoading) {
    return <OdentaLoaderPanel label="Loading the desk" />;
  }

  return (
    <DashboardShell
      user={user}
      role={ROLES.UNI_ASSISTANT}
      subtitle={user?.title}
      actions={
        <>
          <Button
            variant="secondary"
            leftIcon={<CalendarCheck className="h-4 w-4" />}
            onClick={() => navigate(uni.appointments)}
          >
            Intake list
          </Button>
          <Button
            leftIcon={<UserRoundPlus className="h-4 w-4" />}
            onClick={() => navigate(uni.registry)}
          >
            Register a patient
          </Button>
        </>
      }
      kpis={[
        {
          label: "Patients on file",
          value: formatNumber(counts.onFile),
          hint: `${formatNumber(registeredThisMonth)} registered this month`,
          icon: <UsersRound />,
        },
        {
          label: "Booked today",
          value: formatNumber(counts.booked),
          tone: "info",
          hint: `${inChair.length} in a chair now`,
          icon: <CalendarCheck />,
        },
        {
          label: "Waiting",
          value: formatNumber(counts.waiting),
          tone: "warning",
          hint: "arrived or not yet checked in",
          icon: <Users />,
        },
        {
          label: "Needs a student",
          value: formatNumber(counts.unassigned),
          tone: "danger",
          hint: "screened, nobody allocated",
          icon: <UserPlus />,
        },
      ]}
    >
      <div className="grid grid-cols-12 gap-5">
        {/* ------------------------------------------------------ the doors */}
        <Card className="col-span-12">
          <CardHeader title="Quick actions" subtitle="Everything the desk starts from" />
          <CardBody className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3 xl:grid-cols-6">
            {doorsFor(summary).map((door) => {
              const Icon = door.icon;
              return (
                <button
                  key={door.label}
                  type="button"
                  onClick={() => navigate(door.to)}
                  className="od-focus relative flex flex-col items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-card"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${door.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[12.5px] font-bold text-ink">{door.label}</span>
                  {door.count ? (
                    <span className="absolute right-2 top-2 min-w-[20px] rounded-full bg-danger px-1.5 py-0.5 text-[10.5px] font-extrabold text-white">
                      {door.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </CardBody>
        </Card>

        {/* ----------------------------------------------------- the curve */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Patient growth"
            subtitle="New registrations per month"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11.5px] font-bold text-success-strong">
                <TrendingUp className="h-3.5 w-3.5" />
                {formatNumber(registeredThisMonth)} this month
              </span>
            }
          />
          <CardBody className="pt-2">
            {growth.length ? (
              <LineAreaChart
                data={growth}
                height={240}
                tooltipLabel="New patients"
                valueFormatter={(value) => formatNumber(value ?? 0)}
              />
            ) : (
              <EmptyState title="No registrations yet" className="py-12" />
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------------- today */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Today's appointments"
            subtitle={`${waiting.length} waiting · ${inChair.length} in a chair`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.appointments)}>
                Full list
              </Button>
            }
          />
          <CardBody className="pt-2">
            {visits.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck className="h-6 w-6" />}
                title="Nobody booked today"
                description="The clinic is closed or the list is empty."
                className="py-12"
                action={
                  <Button size="sm" onClick={() => navigate(uni.appointments)}>
                    Book a visit
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {visits.slice(0, VISIT_ROWS).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setOpened(item)}
                      className="od-focus flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="w-[52px] shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-center text-[12px] font-extrabold text-ink-muted">
                          {item.time}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-bold text-ink">
                            {item.patientName}
                          </span>
                          <span className="block truncate text-[12px] text-ink-soft">
                            {item.studentName ?? "No student allocated"} · {item.chiefComplaint}
                          </span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {item.channel === "public_booking" ? (
                          <Badge tone="info">
                            <Globe className="h-3 w-3" />
                            Online
                          </Badge>
                        ) : null}
                        <Badge tone={toneFor(item.status)}>{labelFor(item.status)}</Badge>
                        {/* The two things the desk does to a row without
                            opening it. Both stop the click so the row's own
                            handler does not also fire. */}
                        {item.studentName ? null : (
                          <Button
                            variant="secondary"
                            size="xs"
                            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                            onClick={(event) => {
                              event.stopPropagation();
                              setAssigning(item);
                            }}
                          >
                            Assign
                          </Button>
                        )}
                        {item.status === "registered" ? (
                          <Button
                            variant="secondary"
                            size="xs"
                            leftIcon={<LogIn className="h-3.5 w-3.5" />}
                            onClick={(event) => {
                              event.stopPropagation();
                              checkIn(item);
                            }}
                          >
                            Check in
                          </Button>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <AppointmentDetailsModal
        appointment={opened}
        open={Boolean(opened)}
        onClose={() => setOpened(null)}
        onChanged={(status) => {
          toast.success(`Marked ${labelFor(status).toLowerCase()}`, opened?.patientName);
          reload();
        }}
        onAssignStudent={(item) => {
          setOpened(null);
          setAssigning(item);
        }}
      />

      <AssignStudentModal
        appointment={assigning}
        open={Boolean(assigning)}
        onClose={() => setAssigning(null)}
        onAssigned={(student) => {
          toast.success("Student assigned", `${student.name} · ${assigning?.patientName}`);
          reload();
        }}
      />
    </DashboardShell>
  );
}
