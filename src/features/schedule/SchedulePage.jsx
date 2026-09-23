import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { addDays, format } from "date-fns";
import { CalendarCheck, ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { clinicService, scheduleService } from "@/services";
import { formatShortDate } from "@/lib/format";
import { APPOINTMENT_STATUS } from "@/config/domain";
import { P } from "@/auth/permissions";
import { ROLES } from "@/auth/roles";
import { useAuth } from "@/auth/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { CalendarBoard } from "./CalendarBoard";
import { ReservationDrawer } from "./ReservationDrawer";
import { AddToWaitlistModal } from "./AddToWaitlistModal";

const iso = (date) => format(date, "yyyy-MM-dd");

function BoardToolbar({ date, onDate, total, dentistId, onDentist, dentists, onCreate, canCreate }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-muted">
          <CalendarCheck className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[22px] font-extrabold text-ink">{total}</span>
        <span className="text-[13px] text-ink-soft">total appointments</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onDate(new Date())}>
          Today
        </Button>
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => onDate(addDays(date, -1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next day"
          onClick={() => onDate(addDays(date, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition hover:bg-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-[15px] font-bold text-ink">{formatShortDate(date)}</span>
      </div>

      {/* Wraps rather than running off the side: three controls plus a
          "New reservation" button is wider than a phone, and the row used to
          push the whole board 51px past the viewport. */}
      <div className="flex flex-wrap items-center gap-2">
        <MiniSelect className="h-9" value={dentistId} onChange={(event) => onDentist(event.target.value)}>
          <option value="all">All Dentist</option>
          {dentists.map((dentist) => (
            <option key={dentist.id} value={dentist.id}>
              {dentist.name}
            </option>
          ))}
        </MiniSelect>
        <Button variant="secondary" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />}>
          Filters
        </Button>
        {canCreate ? (
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onCreate({})}>
            New reservation
          </Button>
        ) : null}
      </div>
    </div>
  );
}

const LOG_COLUMNS = [
  {
    key: "at",
    header: "Time",
    sortable: true,
    width: 190,
    render: (row) => (
      <span className="text-[13px] font-semibold text-ink">
        {format(new Date(row.at), "dd MMM yyyy · HH:mm")}
      </span>
    ),
  },
  {
    key: "actor",
    header: "Actor",
    render: (row) => (
      <span className="flex items-center gap-2.5">
        <Avatar name={row.actor} size="xs" />
        <span className="text-[13px] font-semibold text-ink">{row.actor}</span>
      </span>
    ),
  },
  { key: "action", header: "Action", render: (row) => <Badge tone="brand">{row.action}</Badge> },
  { key: "target", header: "Target" },
];

export default function SchedulePage() {
  const { can, role, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [date, setDate] = useState(new Date());

  /* a dentist lands on their own column; everyone else sees the whole board */
  const ownOnly = role === ROLES.DENTIST && !can(P.APPOINTMENT_VIEW_ALL);
  const [dentistId, setDentistId] = useState(ownOnly ? user?.staffId ?? "all" : "all");
  const [active, setActive] = useState(null);

  const drawer = useDisclosure();
  const waitlist = useDisclosure(params.get("new") === "1");

  const { data: dentists = [], loading: loadingDentists } = useAsync(
    () => clinicService.getDentists(),
    [],
    [],
    /* The roster changes about once a month and is read on every schedule
       open, which makes it the clearest win on this screen. */
    { key: "clinic:dentists" }
  );
  const { data: appointments = [], loading, refetch } = useAsync(
    () => scheduleService.getAppointments({ date: iso(date), dentistId }),
    [date, dentistId],
    [],
    /* Paging back and forth through the week is the motion this makes
       instant — each day keeps its last answer for a minute. */
    { key: `clinic:appointments:${iso(date)}:${dentistId}` }
  );
  const { data: logs = [] } = useAsync(() => scheduleService.getAppointmentLog(), [], []);

  const visibleDentists = useMemo(
    () => (dentistId === "all" ? dentists : dentists.filter((item) => item.id === dentistId)),
    [dentists, dentistId]
  );

  const statusCounts = useMemo(() => {
    const counts = {};
    appointments.forEach((item) => {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
    });
    return counts;
  }, [appointments]);

  const openAppointment = (appointment) => {
    setActive(appointment);
    drawer.open();
  };

  const closeWaitlist = () => {
    waitlist.close();
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  };

  return (
    <div className="flex h-full flex-col px-4 pb-4 sm:px-6 sm:pb-6">
      <Tabs defaultValue="calendar" className="h-full">
        <TabsList className="pt-4">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="log">Log History</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="flex min-h-0 flex-col">
          <BoardToolbar
            date={date}
            onDate={setDate}
            total={appointments.length}
            dentistId={dentistId}
            onDentist={setDentistId}
            dentists={ownOnly ? visibleDentists : dentists}
            onCreate={waitlist.open}
            canCreate={can(P.APPOINTMENT_CREATE)}
          />

          <div className="mb-3 flex flex-wrap items-center gap-2">
            {Object.entries(APPOINTMENT_STATUS)
              .filter(([key]) => key !== "no_show" || statusCounts.no_show)
              .map(([key, meta]) => (
                <Badge key={key} tone={meta.tone}>
                  {meta.label} · {statusCounts[key] ?? 0}
                </Badge>
              ))}
          </div>

          {loading || loadingDentists ? (
            <Skeleton className="h-[520px] w-full" />
          ) : (
            <CalendarBoard
              dentists={visibleDentists}
              appointments={appointments}
              onOpenAppointment={openAppointment}
              onCreate={can(P.APPOINTMENT_CREATE) ? waitlist.open : undefined}
            />
          )}
        </TabsContent>

        <TabsContent value="log" className="pt-5">
          <DataTable columns={LOG_COLUMNS} rows={logs} emptyTitle="No activity yet" />
        </TabsContent>
      </Tabs>

      <ReservationDrawer
        open={drawer.isOpen}
        onClose={() => {
          drawer.close();
          refetch();
        }}
        appointment={active}
        dentists={dentists}
      />

      <AddToWaitlistModal
        open={waitlist.isOpen}
        onClose={closeWaitlist}
        preset={waitlist.payload}
        date={date}
        onCreated={refetch}
      />
    </div>
  );
}
