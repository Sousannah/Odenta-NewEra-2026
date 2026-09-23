import { useState } from "react";
import { CalendarClock, GraduationCap } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDebounced } from "@/hooks";
import { universityService } from "@/services";
import { toDateKey } from "@/lib/time";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { InfoBanner, SearchInput } from "@/components/ui/Misc";
import { AcademicYearChip } from "@/university/components";

/**
 * Put a student on a visit.
 *
 * The desk is choosing between people, so the list shows the one thing that
 * decides it: how many chairs that student already has on the same day. A
 * student with three visits booked is not the right answer however good their
 * scores are, and without this the desk finds that out at the chair.
 */
export function AssignStudentModal({ appointment, open, onClose, onAssigned }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const search = useDebounced(query);

  /**
   * The cohort, with each student's chair load on this visit's day, ranked
   * emptiest-day-first — which is the order the desk would pick by hand.
   *
   * Both halves used to be client-side: the whole student list *and* every
   * appointment booked on the day, downloaded on every open so the browser
   * could count them into a map. The count is a fact the server already holds,
   * so it sends `loadOnDate` with the row and sorts by it.
   */
  const { data: visible = [], loading } = useAsync(
    () =>
      open
        ? universityService.getAllocatableStudents({
            date: appointment?.date,
            q: search || undefined,
            limit: 50,
          })
        : Promise.resolve([]),
    [open, appointment?.date, search],
    []
  );

  const assign = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await universityService.updateAppointment(appointment.id, {
        studentId: selected.id,
        studentName: selected.name,
      });
      onAssigned?.(selected);
      onClose?.();
    } catch (cause) {
      setError(cause?.message ?? "Could not assign this student.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign a student"
      description={
        appointment
          ? `${appointment.patientName} · ${appointment.date} at ${appointment.time}`
          : undefined
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} disabled={!selected} onClick={assign}>
            {selected ? `Assign ${selected.firstName ?? selected.name}` : "Assign"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

        {appointment?.studentName ? (
          <InfoBanner tone="neutral">
            Currently with <strong>{appointment.studentName}</strong>. Choosing someone else
            replaces them on this visit.
          </InfoBanner>
        ) : null}

        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by name, student number or group…"
        />

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-6 w-6" />}
            title="No student matches that search"
            className="py-10"
          />
        ) : (
          <ul className="flex max-h-[46vh] flex-col gap-2 overflow-y-auto pr-1">
            {visible.map((student) => {
              const load = student.loadOnDate ?? 0;
              const isSelected = selected?.id === student.id;
              return (
                <li key={student.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelected(student)}
                    className={cn(
                      "od-focus flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition",
                      isSelected
                        ? "border-brand-600 bg-brand-50/70"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <Avatar name={student.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-ink">
                        {student.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-soft">
                        {student.studentNumber} · {student.group}
                      </span>
                    </span>
                    <AcademicYearChip year={student.academicYear} />
                    <Badge tone={load >= 3 ? "danger" : load > 0 ? "warning" : "success"}>
                      <CalendarClock className="h-3 w-3" />
                      {load} on {toDateKey(appointment?.date) === toDateKey() ? "today" : "the day"}
                    </Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
