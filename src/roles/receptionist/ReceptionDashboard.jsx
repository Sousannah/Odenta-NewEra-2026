import { useNavigate, useOutletContext } from "react-router-dom";
import {
  CalendarPlus,
  LogIn,
  PhoneCall,
  Receipt,
  UserPlus,
  Users,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { analyticsService, financeService, patientService, scheduleService } from "@/services";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { DashboardShell, AppointmentList, toneFor } from "@/components/shared";
import { GroupedBarChart } from "@/components/charts";

/**
 * Receptionist / front office.
 *
 * Arrivals, check-in, the waitlist, recalls to chase and money still to
 * collect — everything that happens at the desk rather than in the chair.
 */
export default function ReceptionDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data, loading } = useAsync(() => analyticsService.getDashboard(ROLES.RECEPTIONIST), []);
  const { data: appointments = [], refetch } = useAsync(
    () => scheduleService.getAppointments({ date: todayIso }),
    [],
    []
  );
  const { data: waitlist = [] } = useAsync(() => scheduleService.getWaitlist(), [], []);
  const { data: recalls = [] } = useAsync(() => patientService.getRecalls(), [], []);
  const { data: bills = [] } = useAsync(() => financeService.getBills(), [], []);

  const expected = appointments.filter((item) => item.status === "registered");
  const openBills = bills.filter((item) => item.payment !== "FULLY PAID");
  const overdueRecalls = recalls.filter((item) => item.status === "overdue");

  if (loading || !data) {
    return (
      <div className="grid grid-cols-12 gap-5 p-6">
        <CardSkeleton className="col-span-12 xl:col-span-7" />
        <CardSkeleton className="col-span-12 xl:col-span-5" />
      </div>
    );
  }

  const { kpis, hourlyArrivals } = data;

  const checkIn = async (appointment) => {
    await scheduleService.checkIn(appointment.id);
    toast.success("Checked in", appointment.patientName);
    refetch();
  };

  return (
    <DashboardShell
      user={user}
      role={ROLES.RECEPTIONIST}
      subtitle="Front desk"
      actions={
        <>
          <Button
            variant="secondary"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => navigate("/patients?new=1")}
          >
            Register patient
          </Button>
          <Button leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => navigate("/schedule?new=1")}>
            Book appointment
          </Button>
        </>
      }
      kpis={[
        { label: "Arrivals today", value: formatNumber(appointments.length), icon: <Users className="h-5 w-5" /> },
        { label: "Checked in", value: formatNumber(appointments.filter((a) => a.checkedInAt).length), tone: "success", icon: <LogIn className="h-5 w-5" /> },
        { label: "On waitlist", value: formatNumber(waitlist.length), tone: "warning", icon: <PhoneCall className="h-5 w-5" /> },
        { label: "Outstanding", value: formatMoney(kpis.outstanding.total), change: kpis.outstanding.change, tone: "danger", icon: <Receipt className="h-5 w-5" /> },
      ]}
    >
      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Expected now"
            subtitle={`${expected.length} patient(s) yet to check in`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/schedule")}>
                Full board
              </Button>
            }
          />
          <CardBody className="pt-1">
            <AppointmentList
              appointments={expected}
              showDentist
              onSelect={(item) => navigate(`/patients/${item.patientId}`)}
              renderAction={(item) => (
                <Button size="xs" leftIcon={<LogIn className="h-3.5 w-3.5" />} onClick={() => checkIn(item)}>
                  Check in
                </Button>
              )}
              emptyTitle="Everyone is in"
              emptyDescription="No outstanding arrivals for today."
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Arrivals by hour" subtitle="Booked against actually arrived" />
          <CardBody className="pt-3">
            <GroupedBarChart
              data={hourlyArrivals}
              xKey="hour"
              height={230}
              series={[
                { key: "booked", label: "Booked", color: "#CBD5E1", format: "number" },
                { key: "arrived", label: "Arrived", color: "#4B66E9", format: "number" },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Waitlist"
            subtitle="Offer these patients any cancellation"
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/schedule")}>
                Schedule
              </Button>
            }
          />
          <CardBody className="pt-2">
            {waitlist.length === 0 ? (
              <EmptyState title="Waitlist is clear" className="py-10" />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {waitlist.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">
                        {entry.patientName}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {entry.treatment} · {entry.note}
                      </span>
                    </span>
                    <Badge tone={entry.priority === "urgent" ? "danger" : "neutral"}>
                      {entry.priority}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Recalls to chase"
            subtitle={`${overdueRecalls.length} overdue`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/recalls")}>
                All recalls
              </Button>
            }
          />
          <CardBody className="pt-2">
            {recalls.length === 0 ? (
              <EmptyState title="No recalls due" className="py-10" />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {recalls.slice(0, 6).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">
                        {entry.patient?.name}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {entry.reason} · due {formatDate(entry.dueDate, "d MMM yyyy")}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge tone={toneFor(entry.status)}>{entry.status}</Badge>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => toast.success("Recall call logged", entry.patient?.name)}
                      >
                        Call
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="col-span-12">
          <CardHeader
            title="Money to collect"
            subtitle={`${openBills.length} open bill(s)`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/sales")}>
                Take payment
              </Button>
            }
          />
          <CardBody className="grid gap-3 pt-3 sm:grid-cols-2 xl:grid-cols-3">
            {openBills.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => navigate("/sales")}
                className="rounded-2xl border border-slate-200 px-4 py-3.5 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-bold text-ink">{entry.patient}</span>
                  <Badge tone={toneFor(entry.payment)}>{entry.payment}</Badge>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="text-[11px] text-ink-soft">#{entry.id}</span>
                  <span className="text-[16px] font-extrabold text-ink">
                    {formatMoney(entry.total)}
                  </span>
                </div>
              </button>
            ))}
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
