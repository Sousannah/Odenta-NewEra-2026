import { useCallback, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  CalendarPlus,
  FlaskConical,
  LogIn,
  PhoneCall,
  Receipt,
  UserPlus,
  Users,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { labService, patientService, scheduleService } from "@/services";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { DashboardShell, AppointmentList, toneFor } from "@/components/shared";
import { GroupedBarChart } from "@/components/charts";
import { app } from "@/config/paths";

/**
 * Receptionist / front office.
 *
 * Arrivals, check-in, the waitlist, recalls to chase, money still to collect,
 * and work back from the lab — everything that happens at the desk rather than
 * in the chair.
 *
 * ## One request, not six
 *
 * This screen used to fetch six lists and measure them in the browser: a canned
 * analytics aggregate, today's appointments, the waitlist, **every** recall on
 * file to show six, **every** bill ever issued to filter the open ones, and
 * **every** lab case ever to find the returned ones. Three of those grow for
 * the life of the practice and were read in full so that a `.filter().length`
 * could produce a number four characters wide — by every machine at the front
 * of the clinic, on every window focus.
 *
 * `GET /front-desk/board` now returns exactly what these six cards render,
 * already bounded and already sorted the way each one displays it. The server
 * folds the hourly chart from the day's list it read anyway (it used to be a
 * hardcoded fixture — the same twelve numbers for every clinic, every day), and
 * the tiles come from counters rather than from tables measured in a browser.
 *
 * `totals` travels beside the bounded lists, so a heading can honestly say
 * "12 open bill(s)" while the card shows eight.
 *
 * The lab card is here rather than on a technician's board because the lab is
 * an outside supplier: the dentist prescribes the case, the lab makes it, and
 * the desk is who notices it has arrived and phones the patient in.
 */
export default function ReceptionDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data: board, loading, refetch } = useAsync(
    () => scheduleService.getFrontDeskBoard(todayIso),
    [todayIso]
  );

  /**
   * Rows the desk has already actioned this session.
   *
   * The board is cached for fifteen seconds on the server, so a refetch
   * immediately after pressing Call can come back showing the same row as
   * un-called. Holding the ids that have been actioned locally means the button
   * stays settled while the board catches up — the write is real either way,
   * and this only governs what the button looks like in between.
   */
  const [actioned, setActioned] = useState(() => new Set());
  const markActioned = useCallback((id) => {
    setActioned((previous) => new Set(previous).add(id));
  }, []);

  if (loading || !board) {
    return <OdentaLoaderPanel />;
  }

  const { kpis, hourlyArrivals, expected, waitlist, recalls, lab, bills, totals } = board;

  const checkIn = async (appointment) => {
    try {
      await scheduleService.checkIn(appointment.id, appointment.date ?? todayIso);
      toast.success("Checked in", appointment.patientName);
      refetch();
    } catch (error) {
      /* A second receptionist got there first, or the visit was cancelled from
         another machine. The server explains which; repeating its message beats
         a generic failure the person cannot act on. */
      toast.error("Could not check in", error.message);
      refetch();
    }
  };

  /**
   * Log a recall call.
   *
   * This used to be `toast.success(...)` and nothing else — the button looked
   * like it worked and wrote nothing, so a second receptionist rang the same
   * person an hour later and the practice could not tell somebody who had
   * declined from somebody nobody had reached.
   */
  const callRecall = async (entry) => {
    try {
      await patientService.logRecallContact(entry.id, { outcome: "called" });
      markActioned(entry.id);
      toast.success("Recall call logged", entry.patient?.name ?? entry.patientName);
    } catch (error) {
      toast.error("Could not log the call", error.message);
    }
  };

  /** The same, for a crown sitting in a box behind the counter. */
  const callLab = async (entry) => {
    try {
      await labService.logLabContact(entry.id, "called");
      markActioned(entry.id);
      toast.success("Collection call logged", entry.patientName);
    } catch (error) {
      toast.error("Could not log the call", error.message);
    }
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
            onClick={() => navigate(`${app.patients}?new=1`)}
          >
            Register patient
          </Button>
          <Button leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => navigate(`${app.schedule}?new=1`)}>
            Book appointment
          </Button>
        </>
      }
      kpis={[
        {
          label: "Arrivals today",
          value: formatNumber(kpis.arrivalsToday.total),
          change: kpis.arrivalsToday.change,
          icon: <Users className="h-5 w-5" />,
        },
        {
          label: "Checked in",
          /* Of the people due today, how many have turned up — a completion
             rate against today's own list, rather than a comparison with a
             different day's weather. */
          value: `${formatNumber(kpis.checkedIn.total)} / ${formatNumber(kpis.checkedIn.ofTotal)}`,
          tone: "success",
          icon: <LogIn className="h-5 w-5" />,
        },
        {
          label: "Back from lab",
          value: formatNumber(kpis.backFromLab.total),
          tone: "warning",
          icon: <FlaskConical className="h-5 w-5" />,
        },
        {
          label: "Outstanding",
          value: formatMoney(kpis.outstanding.total),
          change: kpis.outstanding.change,
          tone: "danger",
          icon: <Receipt className="h-5 w-5" />,
        },
      ]}
    >
      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Expected now"
            subtitle={`${totals.expected} patient(s) yet to check in`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate(app.schedule)}>
                Full board
              </Button>
            }
          />
          <CardBody className="pt-1">
            <AppointmentList
              appointments={expected}
              showDentist
              onSelect={(item) => navigate(app.patient(item.patientId))}
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
            subtitle={`${totals.waitlist} waiting on a cancellation`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate(app.schedule)}>
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
                        {[entry.treatmentName, entry.note].filter(Boolean).join(" · ")}
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
            subtitle={`${totals.recalls} due or overdue`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate(app.recalls)}>
                All recalls
              </Button>
            }
          />
          <CardBody className="pt-2">
            {recalls.length === 0 ? (
              <EmptyState title="No recalls due" className="py-10" />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {recalls.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">
                        {entry.patient?.name ?? entry.patientName}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {entry.reason} · due {formatDate(entry.dueDate, "d MMM yyyy")}
                        {/* How many times somebody has already tried. The whole
                            point of logging a call is that the next person can
                            see it, so it is on the row rather than behind a
                            click. */}
                        {entry.contactCount > 0 ? ` · tried ${entry.contactCount}×` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge tone={toneFor(entry.status)}>{entry.status}</Badge>
                      <Button
                        variant="secondary"
                        size="xs"
                        leftIcon={<PhoneCall className="h-3.5 w-3.5" />}
                        disabled={actioned.has(entry.id)}
                        onClick={() => callRecall(entry)}
                      >
                        {actioned.has(entry.id) ? "Logged" : "Call"}
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Back from the lab"
            subtitle="Call the patient in to fit"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(app.labCases)}>
                All lab cases
              </Button>
            }
          />
          <CardBody className="pt-2">
            {lab.length === 0 ? (
              <EmptyState title="Nothing waiting" description="No finished work sitting at the desk." className="py-10" />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {lab.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">
                        {entry.patientName}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {entry.type} · {entry.labName}
                        {entry.contactCount > 0 ? ` · tried ${entry.contactCount}×` : ""}
                      </span>
                    </span>
                    <Button
                      variant="secondary"
                      size="xs"
                      leftIcon={<PhoneCall className="h-3.5 w-3.5" />}
                      disabled={actioned.has(entry.id)}
                      onClick={() => callLab(entry)}
                    >
                      {actioned.has(entry.id) ? "Logged" : "Call"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Money to collect"
            subtitle={`${totals.bills} open bill(s)`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate(app.sales)}>
                Take payment
              </Button>
            }
          />
          <CardBody className="grid gap-3 pt-3 sm:grid-cols-2">
            {bills.length === 0 ? (
              <EmptyState title="Nothing outstanding" className="col-span-full py-10" />
            ) : (
              bills.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => navigate(app.sales)}
                  className="rounded-2xl border border-slate-200 px-4 py-3.5 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-bold text-ink">{entry.patient}</span>
                    <Badge tone={toneFor(entry.payment)}>{entry.payment}</Badge>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-[11px] text-ink-soft">#{entry.id}</span>
                    {/* What is still owed, not what the bill was for. On a
                        part-paid bill those are different numbers, and the one
                        the desk needs is the one it can still collect. */}
                    <span className="text-[16px] font-extrabold text-ink">
                      {formatMoney(entry.balance ?? entry.total)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
