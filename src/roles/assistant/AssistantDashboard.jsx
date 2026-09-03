import { useNavigate, useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  DoorOpen,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicalService, inventoryService, scheduleService } from "@/services";
import { formatDate, formatNumber } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { SPORE_TEST_INTERVAL_DAYS } from "@/config/dentalStandards";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InfoBanner } from "@/components/ui/Misc";
import { DashboardShell, AppointmentList, toneFor, labelFor } from "@/components/shared";

/**
 * Dental Assistant.
 *
 * Chairside work is physical and time-boxed: which room needs turning over,
 * what the next case needs laid out, what has been sterilised, and what is
 * about to run out mid-procedure.
 */
export default function AssistantDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data: appointments = [] } = useAsync(
    () => scheduleService.getAppointments({ date: todayIso }),
    [],
    []
  );
  const { data: rooms = [], refetch: refetchRooms } = useAsync(
    () => scheduleService.getRooms(),
    [],
    []
  );
  const { data: cycles = [] } = useAsync(() => clinicalService.getSterilizationCycles(), [], []);
  const { data: stocks = [] } = useAsync(() => inventoryService.getStocks(), [], []);

  const lowStock = stocks.filter((item) => item.status !== "IN STOCK");
  const toTurn = rooms.filter((room) => room.status === "turnover");
  const pendingCycles = cycles.filter((cycle) => cycle.result === "pending");
  const failedCycles = cycles.filter((cycle) => cycle.result === "fail");
  const lastSpore = cycles.find((cycle) => cycle.biologicalIndicator);
  const upcoming = appointments.filter((item) =>
    ["registered", "arrived", "encounter"].includes(item.status)
  );

  return (
    <DashboardShell
      user={user}
      role={ROLES.ASSISTANT}
      subtitle="Chairside & infection control"
      actions={
        <>
          <Button
            variant="secondary"
            leftIcon={<Boxes className="h-4 w-4" />}
            onClick={() => navigate("/stocks")}
          >
            Stock
          </Button>
          <Button
            leftIcon={<ShieldCheck className="h-4 w-4" />}
            onClick={() => navigate("/sterilisation")}
          >
            Log a cycle
          </Button>
        </>
      }
      kpis={[
        { label: "Rooms to turn", value: formatNumber(toTurn.length), tone: "warning", icon: <DoorOpen className="h-5 w-5" /> },
        { label: "Cycles today", value: formatNumber(cycles.filter((c) => c.startedAt.startsWith(todayIso)).length), icon: <ShieldCheck className="h-5 w-5" /> },
        { label: "Low or out of stock", value: formatNumber(lowStock.length), tone: "danger", icon: <Boxes className="h-5 w-5" /> },
        { label: "Results pending", value: formatNumber(pendingCycles.length), tone: "warning" },
      ]}
    >
      {failedCycles.length ? (
        <InfoBanner tone="warning" icon={<AlertTriangle className="h-4 w-4" />}>
          Cycle {failedCycles[0].cycleNumber} failed its chemical indicator — the load was
          reprocessed. Review the log before releasing those instruments.
        </InfoBanner>
      ) : null}

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Rooms" subtitle="Turn over between patients" />
          <CardBody className="flex flex-col gap-3 pt-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5",
                  room.status === "turnover" ? "border-warning/40 bg-warning-soft" : "border-slate-200"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-ink-soft" />
                    <span className="text-[13.5px] font-bold text-ink">{room.id}</span>
                    <Badge tone={toneFor(room.status)}>{labelFor(room.status)}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-ink-soft">
                    Last cleaned {formatDate(room.lastCleanedAt, "HH:mm")} · next patient{" "}
                    {room.nextPatientAt ?? "—"}
                  </p>
                </div>
                {room.status === "turnover" ? (
                  <Button
                    size="sm"
                    leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                    onClick={() => {
                      toast.success(`${room.id} marked ready`);
                      refetchRooms();
                    }}
                  >
                    Mark ready
                  </Button>
                ) : (
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-success-strong">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                  </span>
                )}
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Cases to prepare"
            subtitle={`${upcoming.length} still to come through today`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/schedule")}>
                Full board
              </Button>
            }
          />
          <CardBody className="pt-1">
            <AppointmentList
              appointments={upcoming}
              showDentist
              onSelect={(item) => navigate(`/patients/${item.patientId}`)}
              renderAction={(item) => (
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => toast.success("Tray laid out", `${item.treatment} · ${item.room}`)}
                >
                  Set tray
                </Button>
              )}
              emptyTitle="Nothing left to prepare"
              emptyDescription="Every case for today has been through."
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Sterilisation log"
            subtitle={
              lastSpore
                ? `Last spore test ${formatDate(lastSpore.startedAt, "d MMM")} · every ${SPORE_TEST_INTERVAL_DAYS} days`
                : "No spore test recorded"
            }
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/sterilisation")}>
                Open log
              </Button>
            }
          />
          <CardBody className="pt-2">
            <ul className="flex flex-col gap-2.5">
              {cycles.slice(0, 5).map((cycle) => (
                <li
                  key={cycle.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-ink">
                      Cycle {cycle.cycleNumber} · Class {cycle.type}
                    </span>
                    <span className="block truncate text-[12px] text-ink-soft">
                      {formatDate(cycle.startedAt, "d MMM HH:mm")} · {cycle.load}
                    </span>
                  </span>
                  <Badge tone={toneFor(cycle.result)}>{labelFor(cycle.result)}</Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Running low"
            subtitle="Flag anything you will need this session"
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/stocks")}>
                Request
              </Button>
            }
          />
          <CardBody className="pt-2">
            <ul className="flex flex-col gap-2">
              {lowStock.slice(0, 8).map((item) => (
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
                  <Badge tone={toneFor(item.status)}>
                    {item.quantity} {item.unit}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
