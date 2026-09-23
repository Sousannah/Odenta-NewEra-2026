import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Stethoscope,
} from "lucide-react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatShortDate } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { ROLES } from "@/auth/roles";
import { uni } from "@/config/paths";
import { CLINIC_SESSIONS, DEPARTMENTS, departmentMeta, sessionSlots } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input, MiniSelect, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { toneFor, labelFor } from "@/components/shared";
import { DepartmentChip } from "@/university/components";
import { AppointmentOutcomeModal } from "@/university/components/AppointmentOutcomeModal";
import { StudentCalendarBoard } from "./StudentCalendarBoard";

/**
 * The student's calendar.
 *
 * Built on the clinic's reservation board so a student and a dentist read the
 * same picture: a time gutter, hour lanes and a "now" ticker
 * (`StudentCalendarBoard`), fronted by the same toolbar the clinic uses.
 *
 * Three ranges, because they answer three different questions. The day board
 * is "what is happening at my chair now". The week is "when am I actually in
 * clinic" — the one a student plans around, and the reason the board grew a
 * column per day. The month grid is "which week did that visit land in",
 * which neither of the other two can answer.
 */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "registered", label: "Registered" },
  { value: "arrived", label: "Arrived" },
  { value: "encounter", label: "In chair" },
  { value: "finished", label: "Finished" },
  { value: "postponed", label: "Postponed" },
  { value: "cancelled", label: "Cancelled" },
];

const emptyBooking = {
  caseId: "",
  date: "",
  session: CLINIC_SESSIONS[0].value,
  time: CLINIC_SESSIONS[0].start,
  department: DEPARTMENTS[0].key,
  chiefComplaint: "",
  note: "",
};

/** Which session an hour falls in, so clicking an empty lane presets the form. */
const sessionForHour = (hour) =>
  CLINIC_SESSIONS.find((item) => {
    const [start] = item.start.split(":").map(Number);
    const [end] = item.end.split(":").map(Number);
    return hour >= start && hour < end;
  }) ?? CLINIC_SESSIONS[0];

/* ------------------------------------------------------------------ toolbar */

/**
 * One toolbar for the day and week boards.
 *
 * `step` is what the arrows move — a day or a week — so the two views navigate
 * with the same control rather than each growing its own pair of chevrons.
 */
function BoardToolbar({ date, onDate, step = 1, rangeLabel, total, status, onStatus, onCreate }) {
  const unit = step === 7 ? "week" : "day";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-muted">
          <CalendarCheck className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[22px] font-extrabold text-ink">{total}</span>
        <span className="text-[13px] text-ink-soft">
          appointment(s) this {unit === "week" ? "week" : "day"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onDate(new Date())}>
          Today
        </Button>
        <button
          type="button"
          aria-label={`Previous ${unit}`}
          onClick={() => onDate(addDays(date, -step))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Next ${unit}`}
          onClick={() => onDate(addDays(date, step))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition hover:bg-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-[15px] font-bold text-ink">{rangeLabel}</span>
      </div>

      <div className="flex items-center gap-2">
        <MiniSelect className="h-9" value={status} onChange={(event) => onStatus(event.target.value)}>
          {STATUS_FILTERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </MiniSelect>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onCreate()}>
          Add appointment
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- the page */

export default function StudentCalendarPage() {
  const { user, role, campus } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();

  /**
   * One screen, two audiences.
   *
   * A student's board is their own chair; a staff member, the dean or the
   * clinic desk reads the whole clinic. `"all"` is not a special case — it is
   * what the appointments endpoint already means by "everybody" — so the only
   * thing that changes is who the column belongs to.
   */
  const isStudent = role === ROLES.UNI_STUDENT;
  const studentId = isStudent ? user?.staffId : "all";

  const [view, setView] = useState("day");
  const [date, setDate] = useState(new Date());
  const [status, setStatus] = useState("all");
  const [cursor, setCursor] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyBooking);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [outcomeOf, setOutcomeOf] = useState(null);

  const {
    data: appointments = [],
    loading,
    refetch,
  } = useAsync(
    () => universityService.getAppointments({ studentId: studentId ?? "all" }),
    [studentId],
    []
  );
  const { data: cases = [] } = useAsync(
    () => universityService.getCases({ studentId: studentId ?? "all" }),
    [studentId],
    []
  );
  const { data: student } = useAsync(
    () => (isStudent && studentId ? universityService.getStudent(studentId) : null),
    [isStudent, studentId]
  );

  /* Appointments bucketed by `YYYY-MM-DD` so a cell is one lookup, not a scan. */
  const byDay = useMemo(() => {
    const map = new Map();
    appointments.forEach((item) => {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    });
    return map;
  }, [appointments]);

  const dateKey = toDateKey(date);

  const matchesStatus = (item) => status === "all" || item.status === status;

  const dayVisits = useMemo(
    () =>
      (byDay.get(dateKey) ?? [])
        .filter(matchesStatus)
        .sort((a, b) => String(a.time).localeCompare(String(b.time))),
    [byDay, dateKey, status]
  );

  /* The seven days around the selected one, Sunday first — the week the
     teaching timetable is published on. */
  const weekDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 }),
      }),
    [date]
  );

  const weekColumns = useMemo(
    () =>
      weekDays.map((day) => {
        const key = toDateKey(day);
        const visits = (byDay.get(key) ?? []).filter(matchesStatus);
        return {
          key,
          date: key,
          title: format(day, "EEE"),
          subtitle: `${format(day, "d MMM")} · ${visits.length} visit(s)`,
          highlight: isSameDay(day, new Date()),
          visits,
        };
      }),
    [weekDays, byDay, status]
  );

  const weekTotal = useMemo(
    () => weekDays.reduce((sum, day) => sum + (byDay.get(toDateKey(day)) ?? []).length, 0),
    [weekDays, byDay]
  );

  const statusCounts = useMemo(() => {
    const counts = {};
    const source =
      view === "week"
        ? weekDays.flatMap((day) => byDay.get(toDateKey(day)) ?? [])
        : byDay.get(dateKey) ?? [];
    source.forEach((item) => {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
    });
    return counts;
  }, [view, weekDays, byDay, dateKey]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) }),
    [cursor]
  );

  const openBooking = (hour, onDate) => {
    setFormError("");
    const session = hour == null ? CLINIC_SESSIONS[0] : sessionForHour(hour);
    setForm({
      ...emptyBooking,
      date: onDate ?? dateKey,
      session: session.value,
      time:
        hour != null && sessionSlots(session.value).includes(`${String(hour).padStart(2, "0")}:00`)
          ? `${String(hour).padStart(2, "0")}:00`
          : session.start,
    });
    setOpen(true);
  };

  const book = async (event) => {
    event.preventDefault();
    if (!form.caseId) return setFormError("Pick which patient this visit is for.");
    if (!form.date) return setFormError("Pick a date.");
    if (!form.time) return setFormError("Pick a time.");
    if (!form.chiefComplaint.trim()) return setFormError("A chief complaint is required.");

    setSaving(true);
    setFormError("");
    try {
      await universityService.bookCaseAppointment(form.caseId, {
        date: form.date,
        time: form.time,
        session: form.session,
        department: form.department,
        chiefComplaint: form.chiefComplaint,
        note: form.note || null,
      });
      refetch();
      setOpen(false);
      setDate(parseISO(form.date));
      toast.success("Appointment booked", `${format(parseISO(form.date), "d MMM")} at ${form.time}`);
    } catch (error) {
      setFormError(error?.message ?? "Could not book the appointment.");
    } finally {
      setSaving(false);
    }
  };

  const weekLabel = `${format(weekDays[0], "d MMM")} – ${format(weekDays[6], "d MMM yyyy")}`;

  return (
    <div className="flex h-full flex-col px-6 pb-6">
      <Tabs value={view} onValueChange={setView} className="h-full">
        <TabsList className="pt-4">
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month" badge={appointments.length}>
            Month
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------- day board */}
        <TabsContent value="day" className="flex min-h-0 flex-col">
          <BoardToolbar
            date={date}
            onDate={setDate}
            rangeLabel={formatShortDate(date)}
            total={(byDay.get(dateKey) ?? []).length}
            status={status}
            onStatus={setStatus}
            onCreate={() => openBooking()}
          />

          <StatusLegend counts={statusCounts} />

          {loading ? (
            <Skeleton className="h-[520px] w-full" />
          ) : (
            <StudentCalendarBoard
              student={
                isStudent
                  ? (student ?? { name: user?.name })
                  : { name: "The clinic", group: campus?.shortName }
              }
              visits={dayVisits}
              onOpenVisit={setOutcomeOf}
              onCreate={(hour) => openBooking(hour)}
            />
          )}
        </TabsContent>

        {/* ------------------------------------------------------ week board */}
        <TabsContent value="week" className="flex min-h-0 flex-col">
          <BoardToolbar
            date={date}
            onDate={setDate}
            step={7}
            rangeLabel={weekLabel}
            total={weekTotal}
            status={status}
            onStatus={setStatus}
            onCreate={() => openBooking()}
          />

          <StatusLegend counts={statusCounts} />

          {loading ? (
            <Skeleton className="h-[520px] w-full" />
          ) : (
            <StudentCalendarBoard
              columns={weekColumns}
              onOpenVisit={setOutcomeOf}
              onCreate={(hour, onDateKey) => openBooking(hour, onDateKey)}
            />
          )}
        </TabsContent>

        {/* ------------------------------------------------------ month grid */}
        <TabsContent value="month" className="pt-5">
          <div className="grid grid-cols-12 gap-5">
            <Card className="col-span-12 xl:col-span-7">
              <CardHeader
                title={format(cursor, "MMMM yyyy")}
                subtitle={`${appointments.length} appointment(s) in your schedule`}
                action={
                  <div className="flex items-center gap-1">
                    <IconButton
                      size="sm"
                      label="Previous month"
                      onClick={() => setCursor((value) => subMonths(value, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </IconButton>
                    <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
                      Today
                    </Button>
                    <IconButton
                      size="sm"
                      label="Next month"
                      onClick={() => setCursor((value) => addMonths(value, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </IconButton>
                  </div>
                }
              />
              <CardBody className="pt-2">
                <div className="mb-2 grid grid-cols-7 gap-2">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="od-label text-center">
                      {day}
                    </div>
                  ))}
                </div>

                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="grid grid-cols-7 gap-2" style={{ gridAutoRows: "minmax(56px, auto)" }}>
                    {/* Pad so the 1st lands under the right weekday. */}
                    {Array.from({ length: days[0].getDay() }).map((_, index) => (
                      <span key={`pad-${index}`} />
                    ))}

                    {days.map((day) => {
                      const key = toDateKey(day);
                      const count = (byDay.get(key) ?? []).length;
                      const isSelected = isSameDay(day, date);
                      const isToday = isSameDay(day, new Date());

                      return (
                        <button
                          key={key}
                          type="button"
                          /* Picking a day in the month grid is how a student
                             gets from "which week was that" to the board that
                             can actually act on it. */
                          onClick={() => {
                            setDate(day);
                            setView("day");
                          }}
                          className={cn(
                            "od-focus relative flex flex-col items-center justify-center rounded-xl border px-1 py-2 transition",
                            isSelected
                              ? "border-brand-600 bg-brand-50 text-brand-800 shadow-sm"
                              : isToday
                                ? "border-accent-400 bg-accent-50/60 text-ink"
                                : "border-slate-200 text-ink-muted hover:border-slate-300 hover:bg-slate-50",
                            !isSameMonth(day, cursor) && "opacity-60"
                          )}
                        >
                          <span className="text-[13px] font-bold">{format(day, "d")}</span>
                          {count ? (
                            <span className="mt-1 rounded-full bg-brand-600 px-1.5 text-[10px] font-extrabold text-white">
                              {count}
                            </span>
                          ) : (
                            <span className="mt-1 h-[14px]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="col-span-12 xl:col-span-5">
              <CardHeader
                title={format(date, "MMMM d, yyyy")}
                subtitle={`${(byDay.get(dateKey) ?? []).length} appointment(s)`}
                action={
                  <Button variant="link" size="sm" onClick={() => navigate(uni.schedule)}>
                    Clinic sessions
                  </Button>
                }
              />
              <CardBody className="pt-2">
                {(byDay.get(dateKey) ?? []).length === 0 ? (
                  <EmptyState
                    icon={<CalendarDays className="h-6 w-6" />}
                    title="No appointments"
                    description="Nothing booked to your chair on this day."
                    className="py-10"
                    action={
                      <Button size="sm" onClick={() => openBooking()}>
                        Add appointment
                      </Button>
                    }
                  />
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {(byDay.get(dateKey) ?? [])
                      .slice()
                      .sort((a, b) => String(a.time).localeCompare(String(b.time)))
                      .map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => setOutcomeOf(item)}
                            className="od-focus w-full rounded-xl border border-slate-200 px-3.5 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                          >
                            <span className="flex flex-wrap items-start justify-between gap-3">
                              <span className="flex min-w-0 items-start gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                                  <Stethoscope className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-[13px] font-bold text-ink">
                                    {item.patientName}
                                  </span>
                                  <span className="block truncate text-[12px] text-ink-soft">
                                    {item.chiefComplaint ?? departmentMeta(item.department).label}
                                  </span>
                                </span>
                              </span>
                              <span className="flex shrink-0 flex-col items-end gap-1.5">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[12px] font-bold text-ink-muted">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {item.time}
                                </span>
                                <Badge tone={toneFor(item.status)}>{labelFor(item.status)}</Badge>
                              </span>
                            </span>
                            <span className="mt-2 flex flex-wrap items-center gap-2">
                              <DepartmentChip department={item.department} short />
                              {item.note ? (
                                <span className="truncate text-[12px] text-ink-soft">{item.note}</span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------- finish / postpone / cancel */}
      <AppointmentOutcomeModal
        appointment={outcomeOf}
        open={Boolean(outcomeOf)}
        onClose={() => setOutcomeOf(null)}
        onChanged={(next, detail) => {
          toast.success(`Marked ${labelFor(next).toLowerCase()}`, detail);
          refetch();
        }}
        onOpenRecord={(visit) => navigate(uni.patientTab(visit.nationalId, "medical"))}
      />

      {/* ------------------------------------------------------ new booking */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New appointment"
        description={
          isStudent
            ? "Books a chair against one of your allocated patients."
            : "Books a chair against an allocated case."
        }
        size="md"
      >
        <form onSubmit={book} className="flex flex-col gap-4">
          {formError ? <InfoBanner tone="warning">{formError}</InfoBanner> : null}

          <Field label="Patient" required>
            <Select
              value={form.caseId}
              onChange={(event) => {
                const caseId = event.target.value;
                const match = cases.find((item) => item.id === caseId);
                setForm((prev) => ({
                  ...prev,
                  caseId,
                  department: match?.department ?? prev.department,
                  chiefComplaint: match?.chiefComplaint ?? prev.chiefComplaint,
                }));
              }}
            >
              <option value="">Select a patient</option>
              {cases.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.patientName} ({item.nationalId})
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" required>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              />
            </Field>
            <Field label="Session" required>
              <Select
                value={form.session}
                onChange={(event) => {
                  const session = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    session,
                    time: sessionSlots(session)[0] ?? prev.time,
                  }));
                }}
              >
                {CLINIC_SESSIONS.map((session) => (
                  <option key={session.value} value={session.value}>
                    {session.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Time" required>
            <Select
              value={form.time}
              onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
            >
              {sessionSlots(form.session).map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Rotation" required>
            <Select
              value={form.department}
              onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
            >
              {DEPARTMENTS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Chief complaint" required>
            <Textarea
              rows={3}
              value={form.chiefComplaint}
              onChange={(event) => setForm((prev) => ({ ...prev, chiefComplaint: event.target.value }))}
            />
          </Field>

          <Field label="Notes" hint="optional">
            <Textarea
              rows={3}
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/** The status split for whatever range is on screen. */
function StatusLegend({ counts }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {STATUS_FILTERS.filter((item) => item.value !== "all").map((item) => (
        <Badge key={item.value} tone={toneFor(item.value)}>
          {item.label} · {counts[item.value] ?? 0}
        </Badge>
      ))}
    </div>
  );
}
