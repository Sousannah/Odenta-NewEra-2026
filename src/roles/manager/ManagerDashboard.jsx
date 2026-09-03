import { useNavigate, useOutletContext } from "react-router-dom";
import { AlertTriangle, CalendarPlus, DoorOpen, TrendingDown, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { analyticsService, inventoryService, scheduleService } from "@/services";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Stepper";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardShell, AppointmentList, toneFor, labelFor } from "@/components/shared";
import { GroupedBarChart, SegmentBar } from "@/components/charts";

/**
 * Clinic Manager.
 *
 * Runs the floor today: is every chair covered, who has not arrived, which
 * rooms need turning over, what is running out, and what money is still open.
 */
export default function ManagerDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();

  const { data, loading } = useAsync(() => analyticsService.getDashboard(ROLES.MANAGER), []);
  const { data: appointments = [] } = useAsync(
    () => scheduleService.getAppointments({ date: new Date().toISOString().slice(0, 10) }),
    [],
    []
  );
  const { data: rooms = [] } = useAsync(() => scheduleService.getRooms(), [], []);
  const { data: waitlist = [] } = useAsync(() => scheduleService.getWaitlist(), [], []);
  const { data: stocks = [] } = useAsync(() => inventoryService.getStocks(), [], []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-12 gap-5 p-6">
        <CardSkeleton className="col-span-12 xl:col-span-7" />
        <CardSkeleton className="col-span-12 xl:col-span-5" />
      </div>
    );
  }

  const { kpis, coverage, weekly, stock } = data;
  const needsAttention = stocks.filter((item) => item.status !== "IN STOCK");
  const unarrived = appointments.filter((item) => item.status === "registered");

  return (
    <DashboardShell
      user={user}
      role={ROLES.MANAGER}
      subtitle="Floor operations"
      actions={
        <>
          <Button variant="secondary" leftIcon={<Users className="h-4 w-4" />} onClick={() => navigate("/staff")}>
            Staff rota
          </Button>
          <Button leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => navigate("/schedule")}>
            Open schedule
          </Button>
        </>
      }
      kpis={[
        { label: "Appointments today", value: formatNumber(kpis.todayAppointments.total), change: kpis.todayAppointments.change, icon: <CalendarPlus className="h-5 w-5" /> },
        { label: "Chair utilisation", value: formatPercent(kpis.utilisation.total, 0), change: kpis.utilisation.change, icon: <Users className="h-5 w-5" />, tone: "success" },
        { label: "No-show rate", value: formatPercent(kpis.noShowRate.total, 1), change: kpis.noShowRate.change, icon: <TrendingDown className="h-5 w-5" />, tone: "warning" },
        { label: "Open bills", value: formatMoney(kpis.openBills.total), change: kpis.openBills.change, icon: <Wallet className="h-5 w-5" />, tone: "danger" },
      ]}
    >
      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Chair coverage today"
            subtitle="Booked against capacity, with open gaps"
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/schedule")}>
                Fill gaps
              </Button>
            }
          />
          <CardBody className="flex flex-col gap-4 pt-3">
            {coverage.map((row) => {
              const percent = Math.round((row.booked / row.capacity) * 100);
              return (
                <div key={row.dentist}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13.5px] font-bold text-ink">{row.dentist}</span>
                    <span className="shrink-0 text-[12px] text-ink-muted">
                      {row.booked}/{row.capacity} slots ·{" "}
                      <b className={cn(row.gaps > 2 ? "text-danger" : "text-ink")}>{row.gaps} gaps</b>
                    </span>
                  </div>
                  <ProgressBar
                    value={percent}
                    className="mt-2"
                    tone={percent >= 75 ? "success" : percent >= 50 ? "brand" : "warning"}
                  />
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Rooms" subtitle="Turnover status right now" />
          <CardBody className="grid gap-3 pt-3 sm:grid-cols-2">
            {rooms.map((room) => (
              <div key={room.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-ink">
                    <DoorOpen className="h-3.5 w-3.5 text-ink-soft" />
                    {room.id}
                  </span>
                  <Badge tone={toneFor(room.status)}>{labelFor(room.status)}</Badge>
                </div>
                <p className="mt-1.5 text-[12px] text-ink-soft">
                  Next patient {room.nextPatientAt ?? "—"}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Not yet arrived"
            subtitle={`${unarrived.length} patient(s) still expected`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/schedule")}>
                View board
              </Button>
            }
          />
          <CardBody className="pt-1">
            <AppointmentList
              appointments={unarrived}
              showDentist
              onSelect={() => navigate("/schedule")}
              emptyTitle="Everyone has arrived"
              emptyDescription="No outstanding check-ins for today."
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Waitlist"
            subtitle={`${waitlist.length} patient(s) waiting for a slot`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/schedule")}>
                Schedule
              </Button>
            }
          />
          <CardBody className="pt-2">
            {waitlist.length === 0 ? (
              <EmptyState title="Waitlist is clear" description="No one is waiting for a slot." className="py-10" />
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
          <CardHeader title="This week" subtitle="Appointments against revenue" />
          <CardBody className="pt-3">
            <GroupedBarChart
              data={weekly}
              xKey="day"
              height={240}
              dualAxis
              series={[
                { key: "revenue", label: "Revenue", color: "#4B66E9", axis: "left" },
                { key: "appointments", label: "Appointments", color: "#8ECC97", axis: "right", format: "number" },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Inventory attention"
            subtitle={`${needsAttention.length} item(s) at or below threshold`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/stocks")}>
                Order stock
              </Button>
            }
          />
          <CardBody className="pt-3">
            <SegmentBar segments={stock.segments} />
            <ul className="mt-4 flex flex-col gap-2">
              {needsAttention.slice(0, 6).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <AlertTriangle
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        item.status === "OUT OF STOCK" ? "text-danger" : "text-warning"
                      )}
                    />
                    <span className="truncate text-[13px] font-semibold text-ink">{item.name}</span>
                  </span>
                  <span className="shrink-0 text-[12px] text-ink-muted">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
