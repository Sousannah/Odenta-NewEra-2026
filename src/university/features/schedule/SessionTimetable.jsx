import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Ban,
  Building2,
  CalendarDays,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  Layers,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { addDays, format, startOfWeek } from "date-fns";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, fromNow } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { CLINIC_SESSIONS, academicYearLabel, departmentMeta } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { InfoBanner } from "@/components/ui/Misc";
import { PageHeader, StatCard, StatGrid } from "@/components/shared";
import { DepartmentChip, DetailGrid } from "@/university/components";

/**
 * The published weekly timetable, read from either side of the chair.
 *
 * Nobody books a clinic here — the faculty publishes a weekly grid and people
 * turn up to it. So this screen is a read-only week: no add, no delete, and
 * the only thing that ever differs from the published pattern is a
 * cancellation, which is why the toolbar navigates *weeks* rather than days.
 *
 * `mode` decides whose week it is. "student" scopes to the signed-in student's
 * year and group; "staff" scopes to the clinics that one staff member is
 * rostered to run, which is the only schedule they have any use for. The grid,
 * the cancellations and the cell detail are identical either way — the two
 * sides of a clinic should be looking at the same object.
 */

const WEEKDAY_COLUMNS = [
  { weekday: 0, short: "Sun" },
  { weekday: 1, short: "Mon" },
  { weekday: 2, short: "Tue" },
  { weekday: 3, short: "Wed" },
  { weekday: 4, short: "Thu" },
];

/** Minutes between two `HH:mm` marks, as decimal hours. */
const hoursBetween = (start, end) => {
  const [sh, sm] = String(start).split(":").map(Number);
  const [eh, em] = String(end).split(":").map(Number);
  return (eh * 60 + (em || 0) - (sh * 60 + (sm || 0))) / 60;
};

/* ------------------------------------------------------------- a week cell */

function SessionCell({ entry, dateKey, cancellation, onOpen, footnote }) {
  const meta = departmentMeta(entry.department);
  const cancelled = Boolean(cancellation);
  const isToday = dateKey === toDateKey();

  return (
    <button
      type="button"
      onClick={() => onOpen({ entry, dateKey, cancellation })}
      className={cn(
        "od-focus flex h-full w-full flex-col gap-1.5 rounded-xl border px-3 py-2.5 text-left transition",
        cancelled
          ? "border-danger/30 bg-danger-soft/50 hover:border-danger/50"
          : isToday
            ? "border-brand-400 bg-brand-50 hover:border-brand-600"
            : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "min-w-0 truncate text-[13px] font-bold",
            cancelled ? "text-ink-muted line-through" : "text-ink"
          )}
        >
          {meta.label}
        </span>
        {cancelled ? (
          <Badge tone="danger" className="shrink-0">
            <Ban className="h-3 w-3" />
            Cancelled
          </Badge>
        ) : null}
      </span>

      <span className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-semibold text-ink-muted">
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-1.5 py-0.5">
          <Clock3 className="h-3 w-3" />
          {entry.start}–{entry.end}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-1.5 py-0.5">
          <MapPin className="h-3 w-3" />
          {entry.clinicNumber}
        </span>
      </span>

      <span className="truncate text-[11.5px] text-ink-faint">{footnote}</span>
    </button>
  );
}

/* ---------------------------------------------------------------- the page */

export default function SessionTimetable({ mode = "student" }) {
  const { user, campus } = useOutletContext() ?? {};
  const isStaff = mode === "staff";
  const personId = user?.staffId;

  /* the Sunday that opens the displayed week */
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [detail, setDetail] = useState(null);

  const range = useMemo(
    () => ({ from: toDateKey(weekStart), to: toDateKey(addDays(weekStart, 6)) }),
    [weekStart]
  );

  const { data, loading } = useAsync(
    () =>
      universityService.getSessionSchedule({
        ...(isStaff ? { supervisorId: personId ?? "all" } : { studentId: personId ?? "all" }),
        /* a wide window so the "upcoming changes" list survives week paging */
        from: toDateKey(addDays(weekStart, -35)),
        to: toDateKey(addDays(weekStart, 63)),
      }),
    [isStaff, personId, range.from],
    null
  );

  const sessions = data?.sessions ?? [];
  const cancellations = data?.cancellations ?? [];

  /** `${scheduleId}|${date}` → cancellation, so a cell is one lookup. */
  const cancelledBy = useMemo(() => {
    const map = new Map();
    cancellations.forEach((item) => map.set(`${item.scheduleId}|${item.date}`, item));
    return map;
  }, [cancellations]);

  const weekDates = useMemo(
    () => WEEKDAY_COLUMNS.map((column) => toDateKey(addDays(weekStart, column.weekday))),
    [weekStart]
  );

  const cancelledThisWeek = useMemo(
    () => cancellations.filter((item) => weekDates.includes(item.date)),
    [cancellations, weekDates]
  );

  const upcoming = useMemo(() => {
    const today = toDateKey();
    return cancellations
      .filter((item) => item.date >= today)
      .map((item) => ({
        ...item,
        entry: sessions.find((session) => session.id === item.scheduleId) ?? null,
      }))
      .filter((item) => item.entry);
  }, [cancellations, sessions]);

  const weeklyHours = useMemo(
    () => sessions.reduce((sum, item) => sum + hoursBetween(item.start, item.end), 0),
    [sessions]
  );

  const rotations = useMemo(
    () => [...new Set(sessions.map((item) => item.department))],
    [sessions]
  );

  /* What a staff member reads instead of "rotations": how many students they
     are covering across the week, which is the number that decides whether a
     session is workable. */
  const enrolled = useMemo(
    () => sessions.reduce((sum, item) => sum + (item.enrolled ?? 0), 0),
    [sessions]
  );

  const isThisWeek = toDateKey(weekStart) === toDateKey(startOfWeek(new Date(), { weekStartsOn: 0 }));

  if (loading && !data) {
    return <OdentaLoaderPanel />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Clinic sessions"
        description={`${
          isStaff ? "The clinics you are rostered to run" : "Your published rotation timetable"
        }${campus?.term ? ` · ${campus.term} ${campus.academicYear ?? ""}`.trimEnd() : ""}.`}
        actions={
          /* Wraps under the title on a phone: two chevrons and a full date
             read wider than 375px, and the row used to push the page sideways
             rather than going to a second line. */
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <IconButton
              label="Previous week"
              size="sm"
              variant="secondary"
              onClick={() => setWeekStart((value) => addDays(value, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <span className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-[13px] font-bold text-ink sm:min-w-[230px] sm:flex-none sm:px-4 sm:text-[13.5px]">
              {format(weekStart, "d MMM")} – {format(addDays(weekStart, 4), "d MMM yyyy")}
            </span>
            <IconButton
              label="Next week"
              size="sm"
              variant="secondary"
              onClick={() => setWeekStart((value) => addDays(value, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </IconButton>
            <Button
              variant="secondary"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
            >
              This week
            </Button>
          </div>
        }
      />

      <InfoBanner tone="info">
        {isStaff
          ? "Only the clinics you are rostered to run. The grid is published for the whole term and repeats every week; anything cancelled shows here as soon as the desk announces it."
          : "This timetable is set by the faculty — you cannot add or remove a clinic. It repeats every week for the whole term; anything cancelled shows here as soon as the desk announces it."}
      </InfoBanner>

      <StatGrid cols={4}>
        <StatCard
          label="Clinics per week"
          value={sessions.length}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          label="Chair hours per week" value={`${weeklyHours}h`} tone="brand"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          label={isStaff ? "Students on the floor" : "Rotations"}
          value={isStaff ? enrolled : rotations.length}
          icon={isStaff ? <Users className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
        />
        <StatCard
          label="Cancelled this week"
          value={cancelledThisWeek.length}
          tone={cancelledThisWeek.length ? "danger" : "success"}
          icon={<CalendarX2 className="h-5 w-5" />}
        />
      </StatGrid>

      {/* --------------------------------------------------------- the grid */}
      <Card>
        <CardHeader
          title={isThisWeek ? "This week" : format(weekStart, "'Week of' d MMMM yyyy")}
          subtitle={
            data?.staff
              ? `${data.staff.name}${data.staff.title ? ` · ${data.staff.title}` : ""} · Sunday to Thursday`
              : data?.student
                ? `${academicYearLabel(data.student.academicYear)} · ${data.student.group}`
                : "Sunday to Thursday · the clinic is closed Friday and Saturday"
          }
        />
        <CardBody className="pt-2">
          {sessions.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No clinics published"
              description={
                isStaff
                  ? "You are not rostered to any clinic this term yet."
                  : "Nothing is on your timetable for this term yet."
              }
              className="py-14"
            />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[860px]">
                {/* weekday header */}
                <div className="mb-2 grid grid-cols-[110px_repeat(5,1fr)] gap-2">
                  <span />
                  {WEEKDAY_COLUMNS.map((column, index) => {
                    const dateKey = weekDates[index];
                    const isToday = dateKey === toDateKey();
                    return (
                      <div
                        key={column.weekday}
                        className={cn(
                          "rounded-xl px-2 py-2 text-center",
                          isToday ? "bg-brand-50 text-brand-800" : "text-ink-muted"
                        )}
                      >
                        <div className="od-label">{column.short}</div>
                        <div className="mt-0.5 text-[13px] font-extrabold">
                          {format(addDays(weekStart, column.weekday), "d MMM")}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* one row per session band */}
                {CLINIC_SESSIONS.map((session) => (
                  <div
                    key={session.value}
                    className="mb-2 grid grid-cols-[110px_repeat(5,1fr)] items-stretch gap-2"
                  >
                    <div className="flex flex-col justify-center rounded-xl bg-slate-50 px-3 py-3">
                      <span className="text-[12.5px] font-extrabold text-ink">
                        {session.label.replace(" session", "")}
                      </span>
                      <span className="mt-0.5 text-[11.5px] font-semibold text-ink-soft">
                        {session.start}–{session.end}
                      </span>
                    </div>

                    {WEEKDAY_COLUMNS.map((column, index) => {
                      const dateKey = weekDates[index];
                      /* A student has at most one clinic in a slot. A staff
                         member can be rostered to the same slot for more than
                         one year group, so the cell stacks rather than picking
                         the first row and hiding the rest. */
                      const entries = sessions.filter(
                        (item) => item.weekday === column.weekday && item.session === session.value
                      );

                      if (entries.length === 0) {
                        return (
                          <div
                            key={column.weekday}
                            className="flex min-h-[92px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-[11.5px] font-semibold text-ink-faint"
                          >
                            No clinic
                          </div>
                        );
                      }

                      return (
                        <div key={column.weekday} className="flex min-h-[92px] flex-col gap-1.5">
                          {entries.map((entry) => (
                            <SessionCell
                              key={entry.id}
                              entry={entry}
                              dateKey={dateKey}
                              cancellation={cancelledBy.get(`${entry.id}|${dateKey}`)}
                              onOpen={setDetail}
                              footnote={
                                isStaff
                                  ? `${academicYearLabel(entry.academicYear)} · ${entry.enrolled} students`
                                  : entry.supervisorName
                              }
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ------------------------------------------------- announced changes */}
      <Card>
        <CardHeader
          title={isStaff ? "Changes to your clinics" : "Changes to your timetable"}
          subtitle={`${upcoming.length} upcoming cancellation(s)`}
        />
        <CardBody className="pt-2">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Every clinic is running"
              description={
                isStaff
                  ? "None of your clinics has been cancelled."
                  : "Nothing on your timetable has been cancelled."
              }
              className="py-10"
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {upcoming.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft/40 px-3.5 py-3"
                >
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-bold text-ink">
                        {departmentMeta(item.entry.department).label}
                      </span>
                      <DepartmentChip department={item.entry.department} short />
                    </span>
                    <span className="mt-0.5 block text-[12.5px] font-semibold text-ink-muted">
                      {formatDate(item.date, "EEEE, d MMMM")} · {item.entry.start}–{item.entry.end} ·{" "}
                      {item.entry.clinicNumber}
                    </span>
                    <span className="mt-1 block text-[12.5px] text-ink-soft">{item.reason}</span>
                    <span className="mt-1 block text-[11.5px] text-ink-faint">
                      Announced by {item.announcedBy} · {fromNow(item.announcedAt)}
                    </span>
                  </span>
                  <Badge tone="danger" className="shrink-0">
                    <Ban className="h-3 w-3" />
                    Cancelled
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ------------------------------------------------------ session detail */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? departmentMeta(detail.entry.department).label : ""}
        description={
          detail
            ? `${formatDate(detail.dateKey, "EEEE, d MMMM yyyy")} · ${detail.entry.sessionLabel}`
            : ""
        }
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setDetail(null)}>
            Close
          </Button>
        }
      >
        {detail ? (
          <div className="flex flex-col gap-5">
            {detail.cancellation ? (
              <InfoBanner tone="danger">
                <span className="font-bold">This clinic is cancelled.</span> {detail.cancellation.reason}
                <span className="mt-1 block text-[11.5px] font-semibold opacity-80">
                  Announced by {detail.cancellation.announcedBy} ·{" "}
                  {fromNow(detail.cancellation.announcedAt)}
                </span>
              </InfoBanner>
            ) : (
              <InfoBanner tone="info">
                <span className="font-bold">Running as scheduled.</span> Attendance is on the
                timetable — this clinic repeats every {detail.entry.weekdayName}.
              </InfoBanner>
            )}

            <section>
              <h4 className="mb-3 text-[13px] font-bold text-ink">Where and when</h4>
              <DetailGrid
                columns={2}
                items={[
                  { label: "Clinic number", value: detail.entry.clinicNumber },
                  { label: "Floor", value: detail.entry.floor },
                  { label: "Building", value: detail.entry.building },
                  { label: "Units in the clinic", value: `${detail.entry.units} chairs` },
                  { label: "Day", value: detail.entry.weekdayName },
                  { label: "Session", value: detail.entry.sessionLabel },
                  { label: "Time", value: `${detail.entry.start} – ${detail.entry.end}` },
                  {
                    label: "Duration",
                    value: `${hoursBetween(detail.entry.start, detail.entry.end)} hours`,
                  },
                ]}
              />
            </section>

            <section>
              <h4 className="mb-3 text-[13px] font-bold text-ink">Who is running it</h4>
              <DetailGrid
                columns={2}
                items={[
                  { label: "Staff member", value: detail.entry.supervisorName },
                  { label: "Title", value: detail.entry.supervisorTitle },
                  { label: "Clinic coordinator", value: detail.entry.coordinatorName },
                  {
                    label: "Enrolled",
                    value: `${detail.entry.enrolled} of ${detail.entry.capacity} students`,
                  },
                ]}
              />
            </section>

            <section>
              <h4 className="mb-3 text-[13px] font-bold text-ink">Before you come</h4>
              <DetailGrid
                columns={1}
                items={[
                  { label: "Required kit", value: detail.entry.requiredKit },
                  { label: "Dress code", value: detail.entry.dressCode },
                ]}
              />
              {detail.entry.note ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-[12.5px] text-ink-muted">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                  {detail.entry.note}
                </p>
              ) : null}
            </section>

            <section className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[12px] font-bold text-ink-muted">
                <Building2 className="h-3.5 w-3.5" />
                {campus?.shortName ?? "Campus"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[12px] font-bold text-ink-muted">
                <Users className="h-3.5 w-3.5" />
                {academicYearLabel(detail.entry.academicYear)}
              </span>
              <DepartmentChip department={detail.entry.department} />
            </section>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
