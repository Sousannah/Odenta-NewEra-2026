import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { CalendarCheck, ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { clinicService } from "@/services";
import { formatShortDate } from "@/lib/format";
import { APPOINTMENT_STATUS } from "@/config/domain";
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

/* -------------------------------------------------------------- toolbar */

function BoardToolbar({ date, onDate, total, dentistId, onDentist, dentists, onCreate }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-muted">
          <CalendarCheck className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[22px] font-extrabold text-ink">{total}</span>
        <span className="text-[13px] text-ink-soft">total appointments</span>
      </div>

      <div className="flex items-center gap-2">
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

      <div className="flex items-center gap-2">
        <MiniSelect
          className="h-9"
          value={dentistId}
          onChange={(event) => onDentist(event.target.value)}
        >
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
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onCreate({})}>
          New reservation
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ log table */

const LOG_COLUMNS = [
  {
    key: "at",
    header: "Time",
    sortable: true,
    width: 160,
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
  {
    key: "action",
    header: "Action",
    render: (row) => <Badge tone="brand">{row.action}</Badge>,
  },
  { key: "target", header: "Target" },
];

/* ------------------------------------------------------------------ page */

export default function ReservationsPage() {
  const [date, setDate] = useState(new Date());
  const [dentistId, setDentistId] = useState("all");
  const [active, setActive] = useState(null);

  const drawer = useDisclosure();
  const waitlist = useDisclosure();

  const { data: dentists = [], loading: loadingDentists } = useAsync(
    () => clinicService.getDentists(),
    [],
    []
  );
  const { data: reservations = [], loading } = useAsync(
    () => clinicService.getReservations(),
    [],
    []
  );
  const { data: logs = [] } = useAsync(() => clinicService.getLogHistory(), [], []);

  const visibleDentists = useMemo(
    () => (dentistId === "all" ? dentists : dentists.filter((item) => item.id === dentistId)),
    [dentists, dentistId]
  );

  const visibleReservations = useMemo(
    () =>
      dentistId === "all"
        ? reservations
        : reservations.filter((item) => item.dentistId === dentistId),
    [reservations, dentistId]
  );

  const statusCounts = useMemo(() => {
    const counts = {};
    visibleReservations.forEach((item) => {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
    });
    return counts;
  }, [visibleReservations]);

  const openAppointment = (appointment) => {
    setActive(appointment);
    drawer.open();
  };

  return (
    <div className="flex h-full flex-col px-6 pb-6">
      <Tabs defaultValue="calendar" className="h-full">
        <TabsList className="pt-4">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="log">Log History</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="flex min-h-0 flex-col">
          <BoardToolbar
            date={date}
            onDate={setDate}
            total={visibleReservations.length}
            dentistId={dentistId}
            onDentist={setDentistId}
            dentists={dentists}
            onCreate={waitlist.open}
          />

          <div className="mb-3 flex flex-wrap items-center gap-2">
            {Object.entries(APPOINTMENT_STATUS).map(([key, meta]) => (
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
              reservations={visibleReservations}
              onOpenAppointment={openAppointment}
              onCreate={waitlist.open}
            />
          )}
        </TabsContent>

        <TabsContent value="log" className="pt-5">
          <DataTable columns={LOG_COLUMNS} rows={logs} emptyTitle="No activity yet" />
        </TabsContent>
      </Tabs>

      <ReservationDrawer
        open={drawer.isOpen}
        onClose={drawer.close}
        reservation={active}
        dentists={dentists}
      />

      <AddToWaitlistModal
        open={waitlist.isOpen}
        onClose={waitlist.close}
        preset={waitlist.payload}
      />
    </div>
  );
}
