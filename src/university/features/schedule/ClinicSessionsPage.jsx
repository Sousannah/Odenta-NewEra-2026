import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { dateKeyOffset, toDateKey } from "@/lib/time";
import { ROLES } from "@/auth/roles";
import { UP } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { uni } from "@/config/paths";
import { CLINIC_SESSIONS } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, StatCard, StatGrid, toneFor, labelFor } from "@/components/shared";
import { DepartmentChip } from "@/university/components";
import SessionTimetable from "./SessionTimetable";

/**
 * The clinic session board.
 *
 * The teaching clinic runs two sessions a day rather than a rolling diary, so
 * the desk's view is a two-column board per day, not a time grid.
 *
 * Nobody but the desk books a clinic: the faculty publishes a weekly rotation
 * grid and everyone else turns up to it. So the same route renders a read-only
 * timetable for the two people who only ever read it — the student, scoped to
 * their year and group, and the staff member, scoped to the clinics they are
 * rostered to run.
 */
export default function ClinicSessionsPage() {
  const { role } = useOutletContext() ?? {};

  /* Three screens behind one route. Split before any hook runs so no branch
     carries another's state. */
  if (role === ROLES.UNI_STUDENT) return <SessionTimetable mode="student" />;
  if (role === ROLES.UNI_SUPERVISOR) return <SessionTimetable mode="staff" />;
  return <ClinicDayBoard />;
}

/* ---------------------------------------------------------- the desk board */

function ClinicDayBoard() {
  const { campus } = useOutletContext() ?? {};
  const { can } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const canManage = can(UP.UNI_APPOINTMENT_MANAGE);

  const [date, setDate] = useState(() => toDateKey());

  const { data: visits = [], loading, refetch } = useAsync(
    () => universityService.getAppointments({ date }),
    [date],
    []
  );

  const bySession = useMemo(
    () =>
      CLINIC_SESSIONS.map((session) => ({
        ...session,
        visits: visits
          .filter((item) => item.session === session.value)
          .sort((a, b) => a.time.localeCompare(b.time)),
      })),
    [visits]
  );

  const shift = (days) => setDate((current) => dateKeyOffset(days, current));

  const advance = async (visit, status) => {
    await universityService.updateAppointment(visit.id, { status });
    toast.success(`Marked ${labelFor(status).toLowerCase()}`, visit.patientName);
    refetch();
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Clinic sessions"
        description={`Both sessions on the floor${campus?.shortName ? ` at ${campus.shortName}` : ""}.`}
        actions={
          /* Wraps under the title on a phone: two chevrons and a full date
             read wider than 375px, and the row used to push the page sideways
             rather than going to a second line. */
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <IconButton label="Previous day" size="sm" variant="secondary" onClick={() => shift(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <span className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-[13px] font-bold text-ink sm:min-w-[210px] sm:flex-none sm:px-4 sm:text-[13.5px]">
              {formatDate(date, "EEEE, d MMMM yyyy")}
            </span>
            <IconButton label="Next day" size="sm" variant="secondary" onClick={() => shift(1)}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
            <Button variant="secondary" onClick={() => setDate(toDateKey())}>
              Today
            </Button>
          </div>
        }
      />

      <StatGrid cols={4}>
        <StatCard label="Booked" value={visits.length} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard
          label="Arrived" value={visits.filter((item) => ["arrived", "encounter"].includes(item.status)).length} tone="success"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Finished" value={visits.filter((item) => item.status === "finished").length}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Booked online"
          value={visits.filter((item) => item.channel === "public_booking").length}
          tone="warning"
          icon={<Globe className="h-5 w-5" />}
        />
      </StatGrid>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {bySession.map((session) => (
            <Card key={session.value}>
              <CardHeader
                title={session.label}
                subtitle={`${session.start} – ${session.end} · ${session.visits.length} patient(s)`}
              />
              <CardBody className="pt-2">
                {session.visits.length === 0 ? (
                  <EmptyState
                    icon={<CalendarDays className="h-6 w-6" />}
                    title="Nothing booked"
                    description="This session is empty."
                    className="py-12"
                  />
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {session.visits.map((item) => (
                      <li
                        key={item.id}
                        className={cn(
                          "rounded-xl border px-3.5 py-3 transition",
                          item.status === "encounter"
                            ? "border-brand-300 bg-brand-50/50"
                            : "border-slate-200"
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-bold text-ink">
                              {item.time} · {item.patientName}
                            </span>
                            <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
                              {item.chiefComplaint}
                            </span>
                            <span className="mt-0.5 block truncate text-[11.5px] text-ink-faint">
                              {item.studentName ?? "No student allocated"}
                              {item.chair ? ` · chair ${item.chair}` : ""}
                            </span>
                          </span>

                          <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                            {item.channel === "public_booking" ? (
                              <Badge tone="info">
                                <Globe className="h-3 w-3" />
                                Online
                              </Badge>
                            ) : null}
                            {item.department && item.department !== "screening" ? (
                              <DepartmentChip department={item.department} short />
                            ) : (
                              <Badge tone="neutral">Screening</Badge>
                            )}
                            <Badge tone={toneFor(item.status)}>{labelFor(item.status)}</Badge>
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {item.caseId ? (
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => navigate(uni.case(item.caseId))}
                            >
                              Open case
                            </Button>
                          ) : null}
                          {canManage && item.status === "registered" ? (
                            <Button size="xs" onClick={() => advance(item, "arrived")}>
                              Check in
                            </Button>
                          ) : null}
                          {canManage && item.status === "arrived" ? (
                            <Button size="xs" onClick={() => advance(item, "encounter")}>
                              Seat in chair
                            </Button>
                          ) : null}
                          {canManage && item.status === "encounter" ? (
                            <Button
                              size="xs"
                              variant="success"
                              onClick={() => advance(item, "finished")}
                            >
                              Finish visit
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
