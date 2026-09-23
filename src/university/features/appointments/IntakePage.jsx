import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  CalendarX2,
  Globe,
  Hourglass,
  LogIn,
  Phone,
  UserPlus,
} from "lucide-react";
import { useAsync, useDebounced } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { dateKeyOffset, toDateKey } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination, SearchInput } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Toolbar, StatCard, StatGrid, toneFor, labelFor } from "@/components/shared";
import { AddIntakeModal } from "./AddIntakeModal";
import { AppointmentDetailsModal } from "@/university/assistant/AppointmentDetailsModal";
import { AssignStudentModal } from "@/university/assistant/AssignStudentModal";

/**
 * Intake appointments.
 *
 * Everything booked into the screening clinic, whether it came from the public
 * website or was taken over the phone at the desk. `channel` is a column
 * because the two need chasing differently — an online booking has never
 * spoken to anybody.
 */
const PER_PAGE = 15;

export default function IntakePage() {
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("upcoming");
  const [adding, setAdding] = useState(false);
  const [opened, setOpened] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [page, setPage] = useState(1);

  const bounds = useMemo(() => {
    const today = toDateKey();
    if (range === "today") return { from: today, to: today };
    if (range === "upcoming") return { from: today, to: dateKeyOffset(30) };
    if (range === "past") return { to: dateKeyOffset(-1) };
    return {};
  }, [range]);

  /* Wired to the server, so it waits for the desk to stop typing rather than
     issuing a query per keystroke. */
  const search = useDebounced(query);

  /* A filter change invalidates the page number: page 4 of a two-page list is
     an empty screen that reads as "no appointments". */
  useEffect(() => setPage(1), [bounds, search, channel, status]);

  /**
   * One page of the visit list, filtered and counted on the server.
   *
   * The desk's range is "the next thirty days" by default and a teaching
   * clinic books a few hundred visits a week, so reading the range in full to
   * show fifteen rows was the most expensive thing on this screen. `stats`
   * comes back with the page and is counted over the whole filter, so the four
   * tiles stay true without a second pass over the data.
   */
  const { data: pageData, loading, refetch } = useAsync(
    () =>
      universityService.getAppointmentsPage({
        ...bounds,
        page,
        pageSize: PER_PAGE,
        q: search || undefined,
        channel,
        status,
      }),
    [bounds, page, search, channel, status],
    null
  );

  const rows = pageData?.items ?? [];
  const stats = pageData?.stats ?? null;
  const total = pageData?.total ?? 0;
  const pageCount = pageData?.pageCount ?? 1;
  const safePage = pageData?.page ?? page;

  const setStatusOf = async (item, next) => {
    await universityService.updateAppointment(item.id, { status: next });
    toast.success(
      next === "cancelled" ? "Appointment cancelled" : `Moved to ${labelFor(next).toLowerCase()}`,
      `${item.patientName} · ${item.date}`
    );
    refetch();
  };


  const columns = [
    {
      key: "patientName",
      header: "Patient",
      sortable: true,
      render: (item) => (
        <div className="min-w-0">
          <span className="block truncate text-[13.5px] font-bold text-ink">{item.patientName}</span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
            {item.nationalId} · {item.phone}
          </span>
        </div>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-[12.5px] font-semibold text-ink-muted">{item.reference}</span>
      ),
    },
    {
      key: "date",
      header: "When",
      sortable: true,
      render: (item) => (
        <div className="min-w-0">
          <span className="block text-[13px] font-semibold text-ink">
            {formatDate(item.date, "EEE, d MMM yyyy")}
          </span>
          <span className="block text-[12px] text-ink-soft">
            {item.time} · {item.session} session
          </span>
        </div>
      ),
    },
    {
      key: "chiefComplaint",
      header: "Reason",
      render: (item) => (
        <span className="line-clamp-2 max-w-[240px] text-[13px] text-ink-muted">
          {item.chiefComplaint ?? "—"}
        </span>
      ),
    },
    {
      key: "channel",
      header: "Booked via",
      sortable: true,
      render: (item) =>
        item.channel === "public_booking" ? (
          <Badge tone="info">
            <Globe className="h-3 w-3" />
            Website
          </Badge>
        ) : (
          <Badge tone="neutral">
            <Phone className="h-3 w-3" />
            Desk
          </Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => <Badge tone={toneFor(item.status)}>{labelFor(item.status)}</Badge>,
    },
    {
      key: "studentName",
      header: "Student",
      sortable: true,
      render: (item) =>
        item.studentName ? (
          <span className="text-[13px] text-ink">{item.studentName}</span>
        ) : (
          <span className="text-[12.5px] text-ink-faint">Not allocated</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (item) => (
        <span
          className="flex items-center justify-end gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          {item.status === "registered" ? (
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<LogIn className="h-3.5 w-3.5" />}
              onClick={() => setStatusOf(item, "arrived")}
            >
              Check in
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="xs"
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            onClick={() => setAssigning(item)}
          >
            {item.studentName ? "Reassign" : "Assign"}
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Intake appointments"
        description="Screening visits booked into the teaching clinic, from the website and from the desk."
        actions={
          <Button leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => setAdding(true)}>
            Book a visit
          </Button>
        }
      />

      <StatGrid cols={4}>
        <StatCard
          label="Appointments" value={stats?.total ?? total}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          label="Booked online"
          value={stats?.online ?? 0}
          tone="success"
          icon={<Globe className="h-5 w-5" />}
        />
        <StatCard
          label="Not yet arrived" value={stats?.registered ?? 0} tone="warning"
          icon={<Hourglass className="h-5 w-5" />}
        />
        <StatCard
          label="Cancelled" value={stats?.cancelled ?? 0} tone="danger"
          icon={<CalendarX2 className="h-5 w-5" />}
        />
      </StatGrid>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Patient, reference, phone…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <>
            <MiniSelect value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="upcoming">Next 30 days</option>
              <option value="today">Today</option>
              <option value="past">Past</option>
              <option value="all">All time</option>
            </MiniSelect>
            <MiniSelect value={channel} onChange={(event) => setChannel(event.target.value)}>
              <option value="all">Any channel</option>
              <option value="public_booking">Website</option>
              <option value="clinic_desk">Clinic desk</option>
            </MiniSelect>
            <MiniSelect value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Any status</option>
              <option value="registered">Registered</option>
              <option value="arrived">Arrived</option>
              <option value="encounter">In chair</option>
              <option value="finished">Finished</option>
              <option value="postponed">Postponed</option>
              <option value="cancelled">Cancelled</option>
            </MiniSelect>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={(item) => setOpened(item)}
        emptyTitle="No appointments in this range"
        emptyDescription="Try widening the date range or clearing the filters."
      />

      {pageCount > 1 ? (
        <Pagination page={safePage} pageCount={pageCount} total={total} onChange={setPage} />
      ) : null}

      <AddIntakeModal open={adding} onClose={() => setAdding(false)} onCreated={refetch} />

      <AppointmentDetailsModal
        appointment={opened}
        open={Boolean(opened)}
        onClose={() => setOpened(null)}
        onChanged={() => {
          toast.success("Appointment updated", opened?.patientName);
          refetch();
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
          refetch();
        }}
      />
    </div>
  );
}
