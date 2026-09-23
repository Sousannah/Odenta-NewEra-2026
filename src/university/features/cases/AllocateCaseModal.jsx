import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDebounced } from "@/hooks";
import { universityService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { InfoBanner, SearchInput } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { DEPARTMENTS, departmentMeta } from "@/config/academic";
import { AcademicYearChip, ProgressRing } from "@/university/components";

/**
 * Allocate a screened case to a student.
 *
 * Students are ordered by remaining quota in the case's department, because
 * the question the desk is actually answering is "who still needs one of
 * these?" — not "who is free".
 */
export function AllocateCaseModal({ item, open, onClose, onAllocated }) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const activeDepartment = department ?? item?.department ?? DEPARTMENTS[0].key;

  /* The search box queries the server, so it waits for the desk to stop
     typing rather than issuing one query per keystroke. */
  const search = useDebounced(query);

  /**
   * Students who can take this case, already ranked.
   *
   * The ranking — most quota outstanding in this rotation first — is the
   * server's answer, not a sort applied to a cohort the browser downloaded.
   * This modal used to fetch every student in the campus on every open and on
   * every keystroke, then compute `remaining` for each of them client-side, to
   * show a list of a dozen. `quota.remaining` now arrives with the row.
   */
  const { data: ranked = [], loading } = useAsync(
    () =>
      open
        ? universityService.getAllocatableStudents({
            department: activeDepartment,
            q: search || undefined,
            limit: 50,
          })
        : Promise.resolve([]),
    [open, activeDepartment, search],
    []
  );

  const allocate = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await universityService.assignCase(item.id, {
        studentId: selected,
        department: activeDepartment,
      });
      const student = ranked.find((entry) => entry.id === selected);
      toast.success("Case allocated", `${item.patientName} → ${student?.name ?? selected}`);
      onAllocated?.();
      onClose?.();
      setSelected(null);
    } catch (cause) {
      setError(cause?.message ?? "Could not allocate this case");
    } finally {
      setBusy(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Allocate this case"
      description={`${item.patientName} · ${item.chiefComplaint}`}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-[12px] text-ink-soft">
            {ranked.length} student{ranked.length === 1 ? "" : "s"} take{" "}
            {departmentMeta(activeDepartment).label.toLowerCase()} cases
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={allocate}
              loading={busy}
              disabled={!selected}
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              Allocate
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department" hint="changes which quota is counted">
            <Select
              value={activeDepartment}
              onChange={(event) => {
                setDepartment(event.target.value);
                setSelected(null);
              }}
            >
              {DEPARTMENTS.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Find a student">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Name, number or group…"
              inputClassName="h-11"
            />
          </Field>
        </div>

        {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

        <div className="max-h-[340px] overflow-y-auto rounded-2xl border border-slate-200">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : ranked.length === 0 ? (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="No student matches"
              description="Nobody in this rotation matches that search."
              className="py-10"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {ranked.map((student) => {
                const active = selected === student.id;
                return (
                  <li key={student.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(student.id)}
                      className={cn(
                        "od-focus flex w-full items-center gap-4 px-4 py-3 text-left transition",
                        active ? "bg-brand-50" : "hover:bg-slate-50"
                      )}
                    >
                      <ProgressRing
                        value={
                          student.quota.required
                            ? Math.round((student.quota.completed / student.quota.required) * 100)
                            : 0
                        }
                        size={46}
                        stroke={5}
                        tone={student.quota.remaining > 0 ? "warning" : "success"}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-[13.5px] font-bold text-ink">
                            {student.name}
                          </span>
                          <AcademicYearChip year={student.academicYear} />
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
                          {student.group} · {student.studentNumber} · supervised by{" "}
                          {student.supervisorName ?? student.supervisorId}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span
                          className={cn(
                            "block text-[15px] font-extrabold",
                            student.quota.remaining > 0 ? "text-warning-ink" : "text-success-strong"
                          )}
                        >
                          {student.quota.remaining > 0 ? `${student.quota.remaining} left` : "Quota met"}
                        </span>
                        <span className="block text-[11px] text-ink-faint">
                          {student.quota.completed} / {student.quota.required}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
