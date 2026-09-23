import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  DoorOpen,
  Sparkles,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { assistantService } from "@/services";
import { formatDate, formatNumber } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InfoBanner } from "@/components/ui/Misc";
import { DashboardShell, AppointmentList, toneFor, labelFor } from "@/components/shared";
import { app } from "@/config/paths";

/**
 * Dental Assistant.
 *
 * Chairside work is physical and time-boxed: which room needs turning over,
 * what the next case needs laid out, what has been sterilised, and what is
 * about to run out mid-procedure.
 *
 * ## One request, not four
 *
 * This screen used to fetch today's visits, every room, **every sterilisation
 * cycle the practice had ever recorded**, and **every stock line**, then call
 * `.filter().length` four times to produce four numbers that are four
 * characters wide. Two of those tables grow forever, and the sterilisation
 * register is never pruned because it is a legal record — so the dashboard got
 * measurably more expensive every month it ran, on a machine in the
 * sterilisation room that somebody leaves open all day.
 *
 * It is now `GET /assistant/board`: the tallies come off counters the writes
 * maintain, and the panels are capped pages. The cost is flat in the age of the
 * practice.
 *
 * The tiles read from `board.kpis` rather than from the lengths of the arrays
 * below them, and that is load-bearing rather than incidental — the panels are
 * capped at five and eight rows, so counting them would quietly under-report
 * the moment a practice has more than that of anything.
 */
export default function AssistantDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();
  const todayIso = new Date().toISOString().slice(0, 10);

  const {
    data: board,
    loading,
    refetch,
  } = useAsync(() => assistantService.getBoard({ date: todayIso }), [todayIso], null);

  /* Rooms mid-flight, so a second click on the same chair is ignored rather
     than queued — the button is in a room where people press things twice. */
  const [turning, setTurning] = useState(() => new Set());

  const kpis = board?.kpis ?? {};
  const rooms = board?.rooms ?? [];
  const upcoming = board?.upcoming ?? [];
  const sterilisation = board?.sterilisation ?? {};
  const stock = board?.stock ?? {};
  const spore = sterilisation.spore ?? {};

  const markReady = async (room) => {
    if (turning.has(room.id)) return;
    setTurning((prev) => new Set(prev).add(room.id));
    try {
      await assistantService.markRoomReady(room.id, room.status);
      toast.success(`${room.id} marked ready`);
      refetch();
    } catch (cause) {
      /* `concurrent_update` means somebody else moved the chair while this tab
         was showing the old state — a reload is the fix, and saying so is more
         useful than "something went wrong". */
      toast.error(
        cause.code === "concurrent_update" ? "That chair has already moved" : "Could not update the chair",
        cause.message
      );
      refetch();
    } finally {
      setTurning((prev) => {
        const next = new Set(prev);
        next.delete(room.id);
        return next;
      });
    }
  };

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
            onClick={() => navigate(app.stocks)}
          >
            Stock
          </Button>
          <Button
            leftIcon={<ShieldCheck className="h-4 w-4" />}
            onClick={() => navigate(app.sterilisation)}
          >
            Log a cycle
          </Button>
        </>
      }
      kpis={[
        {
          label: "Rooms to turn",
          value: formatNumber(kpis.roomsToTurn?.total ?? 0),
          tone: (kpis.roomsToTurn?.total ?? 0) > 0 ? "warning" : undefined,
          icon: <DoorOpen className="h-5 w-5" />,
        },
        {
          label: "Cycles today",
          value: formatNumber(kpis.cyclesToday?.total ?? 0),
          icon: <ShieldCheck className="h-5 w-5" />,
        },
        {
          label: "Low or out of stock",
          value: formatNumber(kpis.lowStockItems?.total ?? 0),
          tone: (kpis.lowStockItems?.total ?? 0) > 0 ? "danger" : undefined,
          icon: <Boxes className="h-5 w-5" />,
        },
        {
          label: "Results pending",
          value: formatNumber(kpis.resultsPending?.total ?? 0),
          tone: (kpis.resultsPending?.total ?? 0) > 0 ? "warning" : undefined,
          icon: <Timer className="h-5 w-5" />,
        },
      ]}
    >
      {/**
       * The failure banner clears itself.
       *
       * `openFailure` is null once the same steriliser has passed again, so a
       * load that was reprocessed stops shouting. A banner that is always on is
       * a banner nobody reads, which is the failure mode that matters here.
       */}
      {sterilisation.openFailure ? (
        <InfoBanner tone="warning" icon={<AlertTriangle className="h-4 w-4" />}>
          Cycle {sterilisation.openFailure.cycleNumber} on{" "}
          {sterilisation.openFailure.sterilizerId ?? "the autoclave"} failed its indicator and has
          not been followed by a passing run. Do not release those instruments — reprocess the load
          and record the new cycle.
        </InfoBanner>
      ) : null}

      {/**
       * The spore test is a regulatory deadline, not a nice-to-have, so it gets
       * a banner of its own rather than a number in a corner.
       */}
      {spore.due ? (
        <InfoBanner tone="danger" icon={<ShieldCheck className="h-4 w-4" />}>
          {spore.lastAt
            ? `The weekly spore test is ${spore.overdueDays > 0 ? `${spore.overdueDays} day${spore.overdueDays === 1 ? "" : "s"} overdue` : "due today"} — last passing test ${formatDate(spore.lastAt, "d MMM")}.`
            : "No passing spore test is on file. The steriliser has no evidence it is working — run one today."}
        </InfoBanner>
      ) : null}

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Rooms" subtitle="Turn over between patients" />
          <CardBody className="flex flex-col gap-3 pt-3">
            {!loading && rooms.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-ink-soft">No chairs on file.</p>
            ) : null}
            {rooms.map((room) => (
              <div
                key={room.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5",
                  room.status === "turnover"
                    ? "border-warning/40 bg-warning-soft"
                    : "border-slate-200"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-ink-soft" />
                    <span className="text-[13.5px] font-bold text-ink">{room.id}</span>
                    <Badge tone={toneFor(room.status)}>{labelFor(room.status)}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-ink-soft">
                    {room.lastCleanedAt
                      ? `Last cleaned ${formatDate(room.lastCleanedAt, "HH:mm")}`
                      : "Not cleaned today"}
                    {room.lastCleanedBy ? ` by ${room.lastCleanedBy}` : ""} · next patient{" "}
                    {room.nextPatientAt ?? "—"}
                  </p>
                </div>
                {room.status === "turnover" ? (
                  <Button
                    size="sm"
                    loading={turning.has(room.id)}
                    leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                    onClick={() => markReady(room)}
                  >
                    Mark ready
                  </Button>
                ) : (
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-success-strong">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {labelFor(room.status)}
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
              <Button variant="link" size="sm" onClick={() => navigate(app.schedule)}>
                Full board
              </Button>
            }
          />
          <CardBody className="pt-1">
            <AppointmentList
              appointments={upcoming}
              showDentist
              onSelect={(item) => navigate(app.patient(item.patientId))}
              emptyTitle="Nothing left to prepare"
              emptyDescription="Every case for today has been through."
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Sterilisation log"
            subtitle={
              spore.lastAt
                ? `Last spore test ${formatDate(spore.lastAt, "d MMM")} · every ${spore.intervalDays ?? 7} days`
                : "No spore test recorded"
            }
            action={
              <Button variant="link" size="sm" onClick={() => navigate(app.sterilisation)}>
                Open log
              </Button>
            }
          />
          <CardBody className="pt-2">
            <ul className="flex flex-col gap-2.5">
              {(sterilisation.recent ?? []).map((cycle) => (
                <li
                  key={cycle.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-ink">
                      Cycle {cycle.cycleNumber}
                      {cycle.type ? ` · Class ${cycle.type}` : ""}
                      {cycle.sporeTest ? " · spore test" : ""}
                    </span>
                    <span className="block truncate text-[12px] text-ink-soft">
                      {formatDate(cycle.startedAt, "d MMM HH:mm")} · {cycle.load}
                    </span>
                  </span>
                  <Badge tone={toneFor(cycle.result)}>{labelFor(cycle.result)}</Badge>
                </li>
              ))}
              {!loading && (sterilisation.recent ?? []).length === 0 ? (
                <li className="py-6 text-center text-[13px] text-ink-soft">
                  No cycles recorded yet.
                </li>
              ) : null}
            </ul>
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Running low"
            subtitle={
              (kpis.lowStockItems?.total ?? 0) > (stock.low?.length ?? 0)
                ? `Showing ${stock.low?.length ?? 0} of ${kpis.lowStockItems?.total ?? 0}`
                : "Flag anything you will need this session"
            }
            action={
              <Button variant="link" size="sm" onClick={() => navigate(app.stocks)}>
                Request
              </Button>
            }
          />
          <CardBody className="pt-2">
            <ul className="flex flex-col gap-2">
              {(stock.low ?? []).map((item) => (
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
              {!loading && (stock.low ?? []).length === 0 ? (
                <li className="py-6 text-center text-[13px] text-ink-soft">
                  Everything is in stock.
                </li>
              ) : null}
            </ul>

            {/**
             * Expiring stock earns its own list.
             *
             * It is invisible to every other panel on this screen — a full shelf
             * expiring next week is not *low* — and it is the loss a practice
             * actually pays for, because the item was bought and stored and then
             * thrown away.
             */}
            {(stock.expiringSoon ?? []).length ? (
              <div className="mt-4 border-t border-slate-200 pt-3">
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-soft">
                  Expiring soon
                </p>
                <ul className="flex flex-col gap-1.5">
                  {stock.expiringSoon.map((item) => (
                    <li
                      key={item.stockId}
                      className="flex items-center justify-between gap-3 text-[12.5px]"
                    >
                      <span className="truncate text-ink">{item.name}</span>
                      <span className={cn("shrink-0", item.expired ? "text-danger" : "text-warning")}>
                        {item.expired ? "expired" : formatDate(item.expiry, "d MMM")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
