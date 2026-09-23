import { useState } from "react";
import { GraduationCap, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDebounced } from "@/hooks";
import { universityService } from "@/services";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchInput } from "@/components/ui/Misc";
import { AcademicYearChip } from "@/university/components";

/**
 * Choose a student, from a form that is not itself about students.
 *
 * The registration form used to offer the whole cohort in a `<select>`, which
 * is a list of three hundred names in alphabetical order with nothing on it
 * to choose by. The desk is answering "who still needs one of these?", so the
 * picker shows what a select cannot: the quota each student has outstanding
 * in the rotation, already ranked, over a search box.
 *
 * It only picks. Committing the allocation is the caller's job — on the
 * registration form nothing exists to allocate to yet.
 */
export function StudentPickerModal({ open, onClose, onPick, department, selectedId }) {
  const [query, setQuery] = useState("");
  const search = useDebounced(query);

  const { data: ranked = [], loading } = useAsync(
    () =>
      open
        ? universityService.getAllocatableStudents({
            department: department || undefined,
            q: search || undefined,
            limit: 50,
          })
        : Promise.resolve([]),
    [open, department, search],
    []
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign to a student"
      description="Ranked by how much of this rotation's quota they still have to clear."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {selectedId ? (
            <Button
              variant="danger-ghost"
              onClick={() => {
                onPick?.(null);
                onClose?.();
              }}
            >
              Leave unallocated
            </Button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Name, student number or group…"
        />

        <div className="max-h-[46vh] overflow-y-auto rounded-2xl border border-slate-200">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : ranked.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-6 w-6" />}
              title="No student matches"
              description="Nobody in this rotation matches that search."
              className="py-10"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {ranked.map((student) => {
                const active = selectedId === student.id;
                const remaining = student.quota?.remaining ?? 0;
                return (
                  <li key={student.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        onPick?.(student);
                        onClose?.();
                      }}
                      className={cn(
                        "od-focus flex w-full items-center gap-3 px-4 py-3 text-left transition",
                        active ? "bg-brand-50" : "hover:bg-slate-50"
                      )}
                    >
                      <Avatar name={student.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-[13.5px] font-bold text-ink">
                            {student.name}
                          </span>
                          <AcademicYearChip year={student.academicYear} />
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
                          {student.studentNumber} · {student.group}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span
                          className={cn(
                            "block text-[13.5px] font-extrabold",
                            remaining > 0 ? "text-warning-ink" : "text-success-strong"
                          )}
                        >
                          {remaining > 0 ? `${remaining} left` : "Quota met"}
                        </span>
                        {student.quota ? (
                          <span className="block text-[11px] text-ink-faint">
                            {student.quota.completed} / {student.quota.required}
                          </span>
                        ) : null}
                      </span>
                      <UserPlus className="h-4 w-4 shrink-0 text-ink-faint" />
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
