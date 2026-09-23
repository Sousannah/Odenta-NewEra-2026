import { CalendarDays } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { AvatarCard } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/format";
import { toneFor, labelFor } from "@/components/shared";

/**
 * Today's chair, filtered.
 *
 * The two filters are the ones a student actually reaches for: which day, and
 * which slot within it. Everything else is a search away on the calendar.
 */

const DAY_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "week", label: "This week" },
  { value: "all", label: "All appointments" },
];

const HOUR_OPTIONS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
];

export function AppointmentsWidget({
  appointments,
  dayFilter,
  onDayFilterChange,
  hourFilter,
  onHourFilterChange,
  onOpenPatient,
  className,
}) {
  const columns = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-[13px] font-semibold text-ink">
          {formatDate(row.date, "EEE, d MMM")}
        </span>
      ),
    },
    {
      key: "time",
      header: "Time",
      sortable: true,
      render: (row) => <span className="text-[13px] font-semibold text-ink-muted">{row.time}</span>,
    },
    {
      key: "patientName",
      header: "Patient",
      render: (row) => <AvatarCard name={row.patientName} label={row.chiefComplaint} size="sm" />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={toneFor(row.status)}>{labelFor(row.status)}</Badge>,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader
        title="Appointments"
        subtitle={`${appointments.length} visit${appointments.length === 1 ? "" : "s"} in view`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <MiniSelect value={dayFilter} onChange={(event) => onDayFilterChange(event.target.value)}>
              {DAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </MiniSelect>
            <MiniSelect value={hourFilter} onChange={(event) => onHourFilterChange(event.target.value)}>
              <option value="">All hours</option>
              {HOUR_OPTIONS.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </MiniSelect>
          </div>
        }
      />
      <CardBody className="pt-2">
        {appointments.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No appointments found"
            description="Nothing is booked to your chair for this period."
            className="py-10"
          />
        ) : (
          <DataTable
            columns={columns}
            rows={appointments}
            dense
            className="border-0 shadow-none"
            onRowClick={(row) => onOpenPatient?.(row)}
          />
        )}
      </CardBody>
    </Card>
  );
}
